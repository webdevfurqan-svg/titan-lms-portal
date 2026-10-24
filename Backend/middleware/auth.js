function requireLogin(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Please log in.'
    });
  }

  req.user = {
    id: req.session.userId,
    role: req.session.role
  };

  next();
}


function requireTeacher(req, res, next) {
  if (!req.session || req.session.role !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Teachers only.'
    });
  }

  next();
}


function requireStudent(req, res, next) {
  if (!req.session || req.session.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Students only.'
    });
  }

  next();
}


module.exports = {
  requireLogin,
  requireTeacher,
  requireStudent
};