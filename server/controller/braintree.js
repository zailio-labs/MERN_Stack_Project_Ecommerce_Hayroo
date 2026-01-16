const braintree = require("braintree");
require("dotenv").config();

// Validate environment variables
const validateBraintreeConfig = () => {
  const requiredVars = [
    'BRAINTREE_MERCHANT_ID',
    'BRAINTREE_PUBLIC_KEY', 
    'BRAINTREE_PRIVATE_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing Braintree environment variables:', missingVars);
    return false;
  }
  
  return true;
};

// Initialize Braintree gateway
let gateway;
try {
  if (!validateBraintreeConfig()) {
    throw new Error('Braintree configuration incomplete');
  }

  gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox, // Change to Production for live
    merchantId: process.env.BRAINTREE_MERCHANT_ID.trim(),
    publicKey: process.env.BRAINTREE_PUBLIC_KEY.trim(),
    privateKey: process.env.BRAINTREE_PRIVATE_KEY.trim(),
  });
  
  console.log('Braintree gateway initialized in Sandbox mode');
} catch (error) {
  console.error('Failed to initialize Braintree gateway:', error.message);
  // Don't crash the app, but payments will fail
}

class BrainTreeController {
  // Generate client token
  async generateToken(req, res) {
    // Check if gateway is initialized
    if (!gateway) {
      return res.status(503).json({
        success: false,
        error: 'Payment service unavailable',
        message: 'Braintree gateway not initialized'
      });
    }

    try {
      // Using async/await instead of callback (modern approach)
      const response = await gateway.clientToken.generate({});
      
      return res.json({
        success: true,
        clientToken: response.clientToken
      });
      
    } catch (error) {
      console.error('Braintree token generation error:', error);
      
      // Handle specific Braintree errors
      let errorMessage = 'Failed to generate payment token';
      let statusCode = 500;
      
      if (error.type === 'authentication') {
        errorMessage = 'Payment gateway authentication failed';
        statusCode = 401;
      } else if (error.type === 'notFound') {
        errorMessage = 'Payment gateway configuration error';
        statusCode = 404;
      }
      
      return res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Process payment
  async paymentProcess(req, res) {
    const { amountTotal, paymentMethodNonce } = req.body;
    
    // Check if gateway is initialized
    if (!gateway) {
      return res.status(503).json({
        success: false,
        error: 'Payment service unavailable'
      });
    }

    // Validate input
    if (!amountTotal || !paymentMethodNonce) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amountTotal and paymentMethodNonce'
      });
    }

    // Validate amount
    const amount = parseFloat(amountTotal);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Must be a positive number'
      });
    }

    // Format amount to 2 decimal places
    const formattedAmount = amount.toFixed(2);

    try {
      const result = await gateway.transaction.sale({
        amount: formattedAmount,
        paymentMethodNonce: paymentMethodNonce,
        options: {
          submitForSettlement: true,
          storeInVaultOnSuccess: false // Set to true if you want to store customer payment methods
        },
        // Additional options for better tracking
        customFields: {
          internal_order_id: req.body.orderId || 'N/A',
          user_id: req.user?._id || 'guest'
        }
      });

      if (result.success) {
        console.log('Payment successful. Transaction ID:', result.transaction.id);
        console.log('Transaction amount:', result.transaction.amount);
        console.log('Transaction status:', result.transaction.status);
        
        return res.json({
          success: true,
          message: 'Payment processed successfully',
          transaction: {
            id: result.transaction.id,
            amount: result.transaction.amount,
            currency: result.transaction.currencyIsoCode,
            status: result.transaction.status,
            type: result.transaction.type,
            createdAt: result.transaction.createdAt
          }
        });
      } else {
        console.error('Payment failed:', result.message);
        
        // Handle different failure scenarios
        let errorType = 'payment_failed';
        let userMessage = 'Payment failed. Please try again.';
        
        if (result.transaction) {
          console.error('Transaction processor response:', result.transaction.processorResponseCode);
          console.error('Transaction processor text:', result.transaction.processorResponseText);
          
          // Common error codes
          switch (result.transaction.processorResponseCode) {
            case '2000': // Do Not Honor
            case '2001': // Insufficient Funds
              userMessage = 'Your bank declined the transaction. Please contact your bank.';
              errorType = 'bank_declined';
              break;
            case '2002': // Limit Exceeded
              userMessage = 'Card limit exceeded. Please use another payment method.';
              errorType = 'limit_exceeded';
              break;
            case '2003': // Cardholder Authentication Required
              userMessage = 'Additional verification required. Please try again.';
              errorType = 'authentication_required';
              break;
            case '2010': // Invalid CVV
              userMessage = 'Invalid security code. Please check and try again.';
              errorType = 'invalid_cvv';
              break;
            case '2016': // Expired Card
              userMessage = 'Your card has expired. Please use another payment method.';
              errorType = 'expired_card';
              break;
          }
        }
        
        return res.status(400).json({
          success: false,
          error: userMessage,
          errorType: errorType,
          details: result.message,
          transaction: result.transaction ? {
            id: result.transaction.id,
            status: result.transaction.status,
            processorResponse: result.transaction.processorResponseText
          } : null
        });
      }
      
    } catch (error) {
      console.error('Payment processing error:', error);
      
      return res.status(500).json({
        success: false,
        error: 'An unexpected error occurred during payment processing',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Optional: Check transaction status
  async checkTransaction(req, res) {
    const { transactionId } = req.params;
    
    if (!gateway) {
      return res.status(503).json({
        success: false,
        error: 'Payment service unavailable'
      });
    }

    try {
      const transaction = await gateway.transaction.find(transactionId);
      
      return res.json({
        success: true,
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status,
          currency: transaction.currencyIsoCode,
          type: transaction.type,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }
      });
    } catch (error) {
      console.error('Transaction check error:', error);
      
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
  }
}

// ==== FIX: ADD THESE TWO LINES ====
const brainTreeController = new BrainTreeController();
module.exports = brainTreeController;
