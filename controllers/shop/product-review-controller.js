const Order = require("../../models/Order");
const Product = require("../../models/Product");
const ProductReview = require("../../models/Review");

const addProductReview = async (req, res) => {
  try {
    const { productId, userId, userName, reviewMessage, reviewValue } = req.body;

    // 🛠️ Check if the user has purchased the product
    const order = await Order.findOne({
      userId,
      "cartItems.productId": productId,
      orderStatus: { $in: ["confirmed", "delivered"] }, // Ensure order is completed
    });

    console.log("Order Found:", order); // Debugging

    if (!order) {
      return res.status(403).json({
        success: false,
        message: "You need to purchase the product before reviewing it.",
      });
    }

    // 🛠️ Check if user has already reviewed this product
    const checkExistingReview = await ProductReview.findOne({ productId, userId });

    if (checkExistingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product!",
      });
    }

    // 🛠️ Create a new review
    const newReview = new ProductReview({
      productId,
      userId,
      userName,
      reviewMessage,
      reviewValue,
    });

    await newReview.save();

    // 🛠️ Calculate the average review rating
    const reviews = await ProductReview.find({ productId });
    const totalReviewsLength = reviews.length;
    const totalReviewSum = reviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0);
    const averageReview = totalReviewSum / totalReviewsLength;

    await Product.findByIdAndUpdate(productId, { averageReview });

    return res.status(201).json({
      success: true,
      message: "Review added successfully!",
      data: newReview,
    });
  } catch (e) {
    console.error("Server Error:", e);
    return res.status(500).json({
      success: false,
      message: "Something went wrong! Please try again.",
    });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await ProductReview.find({ productId });

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (e) {
    console.error("Server Error:", e);
    return res.status(500).json({
      success: false,
      message: "Error retrieving reviews.",
    });
  }
};

module.exports = { addProductReview, getProductReviews };
