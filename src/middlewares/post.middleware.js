const Post = require("../models/post.model");
const jwt = require("jsonwebtoken");
const { validationResult, body } = require("express-validator");

// Middleware kiểm tra quyền sở hữu bài đăng
exports.checkPostOwnership = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Bài đăng không tồn tại" });
    }

    // Kiểm tra quyền dựa trên role
    if (req.user.role === "admin") {
      // Admin có mọi quyền nên cho phép tiếp tục
      return next();
    } else if (
      req.user.role === "tenant" &&
      post.userId.toString() === req.user.id
    ) {
      // Tenant chỉ có thể chỉnh sửa bài đăng của chính họ
      return next();
    } else {
      // Người dùng không có quyền truy cập
      return res
        .status(403)
        .json({ message: "Bạn không có quyền truy cập bài đăng này" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống", error });
  }
};

// Middleware phân quyền cho role
exports.authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Không có quyền truy cập" });
    }
    next();
  };
};

// Middleware xác thực dữ liệu đầu vào
exports.validatePostData = [
  body("title")
    .isString()
    .isLength({ max: 100 })
    .withMessage("Tiêu đề không được vượt quá 100 ký tự"),
  body("description")
    .isString()
    .isLength({ max: 1000 })
    .withMessage("Mô tả không được vượt quá 1000 ký tự"),
  body("price").isFloat({ min: 0 }).withMessage("Giá phải là số dương"),
  body("location")
    .isString()
    .notEmpty()
    .withMessage("Vị trí không được để trống"),
  body("area").isFloat({ min: 0 }).withMessage("Diện tích phải là số dương"),
  body("categoryId").isMongoId().withMessage("ID danh mục không hợp lệ"),

  // Kiểm tra kết quả của các validations trên
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Middleware kiểm tra xem người dùng có token hợp lệ không
exports.protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "Không có quyền truy cập, vui lòng đăng nhập" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res
        .status(403)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
    req.user = decoded;
    next();
  });
};
