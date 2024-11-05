const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const postMiddleware = require("../middlewares/post.middleware");

router.post(
  "/",
  postMiddleware.protect,
  postMiddleware.authorizeRole(["admin", "user"]),
  postMiddleware.validatePostData,
  postController.createPost
);

// Cập nhật bài đăng (chỉ cho phép người sở hữu bài đăng hoặc admin)
router.put(
  "/:id",
  postMiddleware.protect,
  postMiddleware.checkPostOwnership,
  postMiddleware.validatePostData,
  postController.updatePost
);

// Xóa bài đăng (chỉ cho phép người sở hữu bài đăng hoặc admin)
router.delete(
  "/:id",
  postMiddleware.protect,
  postMiddleware.checkPostOwnership,
  postController.deletePost
);

router.get("/", postController.getAllPosts);

router.get("/:id", postMiddleware.protect, postController.getPostById);

module.exports = router;
