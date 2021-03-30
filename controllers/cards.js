const Card = require('../models/card');
const BadRequestError = require('../errors/bad-request-err');
const NotFoundError = require('../errors/not-found-err');
// функция отдает все карточки
const getCards = (req, res, next) => Card.find({})
  .populate('onwer')
  .then((cards) => res.send(cards))
  .catch(next);
// создать карточку
const createCard = (req, res, next) => {
  const creatorId = req.user._id;
  const { name, link } = req.body;
  Card.create({ name, link, owner: creatorId })
    .then((card) => {
      res.send(card);
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Некорректное название или ссылка на фотографию'));
      } else {
        next(err);
      }
    });
};
// удалить карточку
const deleteCard = (req, res, next) => {
  const { cardId } = req.params;

  Card.findById(cardId)
    .orFail(() => new NotFoundError('Карточка не найдена'))
    .then((card) => {
      if (req.user._id !== String(card.owner)) {
        next(new BadRequestError('Невозможно удалить чужую карточку'));
      } else {
        Card.findByIdAndDelete(cardId)
          .then((remoteCard) => {
            res.send({ data: remoteCard });
          })
          .catch(next);
      }
    })
    .catch((err) => {
      if (err.kind === 'ObjectId') {
        next(new BadRequestError('Некорректный id карточки'));
      } if (err.statusCode === 404) {
        next(new NotFoundError(`${err.message}`));
      } else {
        next(err);
      }
    });
};

// постваить лайк
const likeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $addToSet: { likes: req.user._id } }, // добавить _id в массив, если его там нет
    { new: true },
  )
    .then((card) => {
      if (card === null) {
        return next(new NotFoundError('Карточка не найдена'));
      }
      return res.send({ data: card });
    })
    .catch(next);
};
// убрать лайк
const dislikeCard = (req, res, next) => {
  Card.findByIdAndUpdate(
    req.params.cardId,
    { $pull: { likes: req.user._id } }, // убрать _id из массива
    { new: true },
  )
    .then((card) => {
      if (card === null) {
        return next(new NotFoundError('Карточка не найдена'));
      }
      return res.send({ data: card });
    })
    .catch(next);
};

module.exports = {
  getCards, createCard, deleteCard, likeCard, dislikeCard,
};
