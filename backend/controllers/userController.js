import User from '../models/User.js';

export async function listUsers(_req, res, next) {
  try {
    const users = await User.find({ role: 'patient' }).sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, phone, profileImage } = req.body;
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) return res.status(400).json({ message: 'Name must be a non-empty string.' });
    if (phone !== undefined && (typeof phone !== 'string' || phone.length > 30)) return res.status(400).json({ message: 'Phone must be 30 characters or fewer.' });
    if (profileImage !== undefined && (typeof profileImage !== 'string' || profileImage.length > 500 ||
        (profileImage !== '' && !/^https?:\/\/\S+$/i.test(profileImage)))) {
      return res.status(400).json({ message: 'Profile image must be an HTTP(S) URL with 500 characters or fewer.' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { ...(name !== undefined && { name: name.trim() }), ...(phone !== undefined && { phone }), ...(profileImage !== undefined && { profileImage }) },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (error) {
    next(error);
  }
}
