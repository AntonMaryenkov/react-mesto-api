const NotFoundError = require('../errors/not-found-err');

const error = (req, res, next) => {
  next(new NotFoundError('Запрашиваемый ресурс не найден'));
};

module.exports = error;
