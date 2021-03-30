const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');

const {
  getUsers, getProfile, updateInfoUser, updateAvatarUser, getCurrentUser,
} = require('../controllers/users');

router.get('/users', getUsers);
router.get('/users/me', getCurrentUser);
router.get('/users/:userId', celebrate({
  params: Joi.object().keys({
    userId: Joi.string().alphanum().length(24),
  }),
}), getProfile);

router.patch('/users/me', celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(30),
    about: Joi.string().required().min(2).max(30),
  }),
}), updateInfoUser);
router.patch('/users/me/avatar', celebrate({
  body: Joi.object().keys({
    avatar: Joi.string().required().pattern(/(https?:\/\/)(w{3,3}\.)?((?!-)([a-zA-Z0-9-]){2,63}(?<!-)\.)+[A-Za-z]{2,6}([a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)?#?/),
  }),
}), updateAvatarUser);

module.exports = router;
