const Post = require("../models/post.model");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Cấu hình multer để sử dụng Cloudinary làm bộ nhớ lưu trữ
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "posts", // Thư mục trong Cloudinary để lưu ảnh
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage: storage });

// Middleware upload ảnh
exports.uploadImages = upload.array("images", 10); // Tối đa 10 ảnh cho mỗi bài đăng

// Thêm bài đăng mới
exports.createPost = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      area,
      categoryId,
      servicesBookingId,
    } = req.body;

    let images = [];
    if (req.files) {
      images = req.files.map((file) => file.path); // Lấy URL của mỗi ảnh sau khi tải lên Cloudinary
    }

    const newPost = new Post({
      userId: req.user.id, // Đảm bảo middleware xác thực đã gắn req.user
      title,
      description,
      price,
      location,
      area,
      categoryId,
      servicesBookingId,
      images,
    });

    await newPost.save();
    res
      .status(201)
      .json({ message: "Bài đăng đã được tạo thành công!", post: newPost });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo bài đăng", error });
  }
};

// Lấy tất cả bài đăng với phân trang và lọc
exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {};
    if (req.query.title)
      filters.title = { $regex: req.query.title, $options: "i" };
    if (req.query.location)
      filters.location = { $regex: req.query.location, $options: "i" };
    if (req.query.categoryId) filters.categoryId = req.query.categoryId;

    const posts = await Post.find(filters)
      .skip(skip)
      .limit(limit)
      .populate("userId categoryId servicesBookingId");

    const totalPosts = await Post.countDocuments(filters);
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      page,
      totalPages,
      totalPosts,
      posts,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách bài đăng", error });
  }
};

// Lấy thông tin bài đăng theo ID
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "userId categoryId servicesBookingId"
    );
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy bài đăng", error });
  }
};

// Cập nhật bài đăng
exports.updatePost = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      area,
      categoryId,
      servicesBookingId,
    } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    // Xóa ảnh cũ trên Cloudinary nếu có ảnh mới
    if (req.files && post.images.length > 0) {
      const deletePromises = post.images.map(async (imageUrl) => {
        const publicId = imageUrl.split("/").pop().split(".")[0];
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises); // Xóa đồng thời
    }

    const newImages = req.files
      ? req.files.map((file) => file.path)
      : post.images;

    // Cập nhật bài đăng
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        title: title || post.title,
        description: description || post.description,
        price: price || post.price,
        location: location || post.location,
        area: area || post.area,
        categoryId: categoryId || post.categoryId,
        servicesBookingId: servicesBookingId || post.servicesBookingId,
        images: newImages,
      },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Bài đăng đã được cập nhật", post: updatedPost });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật bài đăng", error });
  }
};

// Xóa bài đăng
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post)
      return res.status(404).json({ message: "Không tìm thấy bài đăng" });

    if (post.images && post.images.length > 0) {
      const deletePromises = post.images.map(async (imageUrl) => {
        const publicId = imageUrl.split("/").pop().split(".")[0];
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises);
    }

    res.status(200).json({ message: "Bài đăng và ảnh đã được xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa bài đăng", error });
  }
};
