const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NotFoundError = require('../errors/not-found-err');
const BadRequestError = require('../errors/bad-request-err');
const AuthError = require('../errors/auth-err');
const RegistrationError = require('../errors/registr-err');

const User = require('../models/user');
// функция отдает всех пользователей
const getUsers = (req, res, next) => User.find({})
  .then((users) => res.send(users))
  .catch(next);
// функция отдает конкретного пользователя
const getProfile = (req, res, next) => {
  const { userId } = req.params;
  User.findById(userId)
    .orFail(() => new NotFoundError('Пользователь по заданному id отсутствует в базе'))
    .then((users) => res.send({ data: users }))
    .catch((err) => {
      if (err.kind === 'ObjectId') {
        next(new BadRequestError('Некорректный id пользователя'));
      } else {
        next(err);
      }
    });
};

const handleError = (err) => {
  if (err.name === 'ValidationError') {
    return true;
  }
  return false;
};
// создать пользователя
const createUser = (req, res, next) => {
  const {
    name, about, avatar, email, password,
  } = req.body;
  return User.findOne({ email })
    .then((user) => {
      if (user) {
        return next(new RegistrationError('Пользователь с таким email уже зарегистрирован'));
      }

      return bcrypt.hash(password, 10)
        .then((hash) => {
          if (password.length < 8) {
            return next(new BadRequestError('Пароль должен быть минимум 8 символов'));
          }
          return User.create({
            name, about, avatar, email, password: hash,
          })
            .then((newUser) => res.send({
              _id: newUser._id,
              name: newUser.name,
              about: newUser.about,
              avatar: newUser.avatar,
              email: newUser.email,
            }))
            .catch((err) => {
              if (handleError(err)) {
                next(new BadRequestError(`${err.message}`));
              } else {
                next(err);
              }
            });
        });
    });
};
// обновить информацию о пользователе
const updateInfoUser = (req, res, next) => {
  const { name, about } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    { name, about },
    // Передадим объект опций:
    {
      new: true, // обработчик then получит на вход обновлённую запись
      runValidators: true, // данные будут валидированы перед изменением
    },
  )
    .then((user) => res.send(user))
    .catch((err) => {
      if (handleError(err)) {
        next(new BadRequestError(`${err.message}`));
      } else {
        next(err);
      }
    });
};
// обновить аватар
const updateAvatarUser = (req, res, next) => {
  const { avatar } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    { avatar },
    // Передадим объект опций:
    {
      new: true, // обработчик then получит на вход обновлённую запись
      runValidators: true, // данные будут валидированы перед изменением
    },
  )
    .then((user) => res.send(user))
    .catch((err) => {
      if (handleError(err)) {
        next(new BadRequestError(`${err.message}`));
      } else {
        next(err);
      }
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      // создадим токен
      const token = jwt.sign({ _id: user._id }, 'some-secret-key', { expiresIn: '7d' });
      // вернём токен
      res.send({ token });
    })
    .catch((err) => {
      next(new AuthError(`${err.message}`));
    });
};

const getCurrentUser = (req, res, next) => {
  const id = req.user._id;

  User.findOne({ _id: id })
    .then((user) => res.send(user))
    .catch(next);
};

module.exports = {
  getUsers, getProfile, createUser, updateInfoUser, updateAvatarUser, login, getCurrentUser,
};
