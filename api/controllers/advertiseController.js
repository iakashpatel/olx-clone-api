const advertisesModel = require('../models/advertisesModel');
const Joi = require('joi');
const slug = require('slug');
const multer = require('multer');
const mkdirp = require('mkdirp');

/* Default Filters */
const defaultMinPrice = 1;
const defaultMaxPrice = 999999999;

// schema for Advertise's ID
const validateId = Joi.object().keys({
  advertiseId: Joi.number().integer()
  .required()
})

// schema for new advertise
const newAdvertiseValidation = Joi.object().keys({
  advertiseUserId: Joi.number().integer().required(),
  advertiseTitle: Joi.string().required(),
  advertiseDescription: Joi.string().required(),
  advertisePrice: Joi.number().precision(2).required(),
  advertiseCondition: Joi.string().required(),
  advertiseCategoryId: Joi.number().integer().required(),
  advertiseLat: Joi.number(),
  advertiseLong: Joi.number(),
  advertiseCityId: Joi.number().integer().required()
}).with('advertiseLat', 'advertiseLong');

// id and userid of advertise validation
const idUserIdValidation = Joi.object().keys({
  advertiseId: Joi.number().integer().required(),
  userId: Joi.number().integer().required()
})

/*
---------------------------------------------------------
  create new advertise
---------------------------------------------------------
*/
exports.createAdvertise = (req, res) => {
  const userId = parseInt(req.session.passport.user.user_id, 0);
  const title = req.body.title;
  const description = req.body.description;
  const price = req.body.price;
  const condition = req.body.condition;
  const categoryId = req.body.categoryId;
  const lat = req.body.lat;
  const long = req.body.long;
  const cityId = req.body.cityId;
  const stage = 'stage1';

  let result;

  if (lat || long){
    result = Joi.validate({
      advertiseUserId: userId,
      advertiseTitle: title,
      advertiseDescription: description,
      advertisePrice: price,
      advertiseCondition: condition,
      advertiseCategoryId: categoryId,
      advertiseLat: lat,
      advertiseLong: long,
      advertiseCityId: cityId
    }, newAdvertiseValidation);
  } else {
    result = Joi.validate({
      advertiseUserId: userId,
      advertiseTitle: title,
      advertiseDescription: description,
      advertisePrice: price,
      advertiseCondition: condition,
      advertiseCategoryId: categoryId,
      advertiseCityId: cityId
    }, newAdvertiseValidation);
  }

  if (!result.error){
    advertisesModel.createAdvertise(userId, title, description, price, condition, categoryId, lat, long, cityId, stage)
    .then((data) => {
      if (!data || data.length <= 0){
        res.status(404).json({
          message: 'Not Found!'
        });
      } else {
        res.status(200).json({
          message: 'Success', data: data
        });
      }
    })
    .catch(e => res.status(500).json({
      message: 'Error Occured!', Stack: e
    }));
  } else {
    res.status(400).json({
      message: 'Invalid Data!'
    });
  }

}

/*
---------------------------------------------------------
  show recent advertise according to pagination
---------------------------------------------------------
*/
exports.uploadAdvertiseImages = (req, res) => {

  const id = parseInt(req.params.id, 0);
  const userId = parseInt(req.session.passport.user.user_id, 0);
  const stage = 'stage2';
  const imagesDate = Date.now();

  const result = Joi.validate({
    advertiseId: id,
    userId: userId
  }, idUserIdValidation);

  if (!result.error){
    // some predefine constants for multer and mkdirp
    const imagePath = "public/images/advertises/" + id + '/';
    const imagesName = [];

    // for insert path into db
    const dbImagePath = "images/advertises/" + id + '/';

    // validate user associated with advertise or not
    advertisesModel.usersAdvertise(userId, id)
    .then((data) => {

      if (!data || data.length === 0){
        res.status(404).json({
          message: 'Not Found!'
        });

      } else {

        mkdirp(imagePath, function (err) {
          if (err) console.error(err)
        });

        // Multer Storage
        const Storage = multer.diskStorage({
          destination: function(req, file, callback) {
            callback(null, imagePath);
          },
          filename: function (req, file, cb) {
            let extension;
            // Mimetype stores the file type, set extensions according to filetype
            switch (file.mimetype) {
              case 'image/jpeg':
                extension = '.jpeg';
                break;
              case 'image/png':
                extension = '.png';
                break;
              case 'image/gif':
                extension = '.gif';
                break;
              default:
                break;
            }

            cb(null, file.originalname.slice(0, 4) + imagesDate + extension);
            imagesName.push(file.originalname.slice(0, 4) + imagesDate + extension);
          }
        });

        // Multer Uploader
        const upload = multer({
          storage: Storage
        }).array("images", 4); //Field name and max count

        // On upload Function
        upload(req, res, function(err) {
          if (err) {
            res.status(500).json({
              message: 'Error Occured!',
              Stack: err
            });
          } else {

            const insertImagesArray = imagesName.map((item) => {
              let fullImagePath = dbImagePath + item;
              return advertisesModel.insertImages(id, fullImagePath)
            })

            Promise.all(insertImagesArray)
            .then(() => {

              advertisesModel.updateStage(id, stage)
              .then(() => {
                res.status(200).json({
                  message: 'Success'
                })
              })
              .catch(e => res.status(500).json({
                message: 'Error Occured!',
                Stack: e
              }));

            })
            .catch(e => res.status(500).json({
              message: 'Error Occured!',
              Stack: e
            }));
          }

        })

      }
    })
    .catch(e => res.status(500).json({
      message: 'Error Occured!',
      Stack: e
    }));
  } else {
    res.status(400).json({
      message: 'Invalid Data!'
    });
  }
}

/*
---------------------------------------------------------
  publish advertise from stage2 to publish
---------------------------------------------------------
*/
exports.publishAdvertise = (req, res) => {
  const id = parseInt(req.params.id, 0);
  const userId = parseInt(req.session.passport.user.user_id, 0);
  const stage = 'published';

  const result = Joi.validate({
    advertiseId: id,
    userId: userId
  }, idUserIdValidation);

  if (!result.error){
    advertisesModel.usersAdvertise(userId, id)
    .then((data) => {

      if (!data || data.length === 0){
        res.status(404).json({
          message: 'Not Found!'
        });
      } else {
        advertisesModel.updateStage(id, stage)
        .then(() => {
          res.status(200).json({
            message: 'Success'
          })
        })
        .catch(e => res.status(500).json({
          message: 'Error Occured!',
          Stack: e
        }));
      }

    })
    .catch(e => res.status(500).json({
      message: 'Error Occured!',
      Stack: e
    }));
  } else {
    res.status(400).json({
      message: 'Invalid Data!'
    });
  }

}

/*
---------------------------------------------------------
  mark item/advertise as sold
---------------------------------------------------------
*/
exports.markAsSold = (req, res) => {
  const id = parseInt(req.params.id, 0);
  const userId = parseInt(req.session.passport.user.user_id, 0);

  const result = Joi.validate({
    advertiseId: id,
    userId: userId
  }, idUserIdValidation);

  if (!result.error){
    advertisesModel.usersAdvertise(userId, id)
    .then((data) => {

      if (!data || data.length === 0){
        res.status(404).json({
          message: 'Not Found!'
        });
      } else {
        advertisesModel.adMarkAsSold(id)
        .then(() => {
          res.status(200).json({
            message: 'Success'
          })
        })
        .catch(e => res.status(500).json({
          message: 'Error Occured!',
          Stack: e
        }));
      }

    })
    .catch(e => res.status(500).json({
      message: 'Error Occured!',
      Stack: e
    }));
  } else {
    res.status(400).json({
      message: 'Invalid Data!'
    });
  }
}

/*
---------------------------------------------------------
  mark item/advertise as un-sold or back again for sell
---------------------------------------------------------
*/
exports.markAsUnsold = (req, res) => {
  const id = parseInt(req.params.id, 0);
  const userId = parseInt(req.session.passport.user.user_id, 0);

  const result = Joi.validate({
    advertiseId: id,
    userId: userId
  }, idUserIdValidation);

  if (!result.error){
    advertisesModel.usersAdvertise(userId, id)
    .then((data) => {

      if (!data || data.length === 0){
        res.status(404).json({
          message: 'Not Found!'
        });
      } else {
        advertisesModel.adMarkAsUnsold(id)
        .then(() => {
          res.status(200).json({
            message: 'Success'
          })
        })
        .catch(e => res.status(500).json({
          message: 'Error Occured!',
          Stack: e
        }));
      }

    })
    .catch(e => res.status(500).json({
      message: 'Error Occured!',
      Stack: e
    }));
  } else {
    res.status(400).json({
      message: 'Invalid Data!'
    });
  }
}

/*
---------------------------------------------------------
  show recent advertise according to pagination
---------------------------------------------------------
*/
exports.getRecentAdvertise = (req, res) => {

  // Pagination
  let page = parseInt(req.query.page, 0);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let limit = parseInt(req.query.limit, 0);
  if (isNaN(limit)) {
    limit = 10;
  } else if (limit < 1) {
    limit = 1;
  }

  let offset = (page - 1) * limit;
  let advertiseData;
  let count;

  const recentAdvertise = advertisesModel.recentAds(limit, offset).then((data) => {
    if (!data){
      res.status(404).json({ message: 'No Data Found' });
    } else {
      advertiseData = data;
    }
  })
  .catch(e => res.status(500).json({
    message: 'Error Occured!',
    Stack: e
  }));

  const advertiseCount = advertisesModel.countRecords()
  .then((data) => {
    if (!data) {
      res.status(404).json({
        message: 'Not Found!'
      });
    } else {
      count = parseInt(data[0].count, 0);
    }
  })
  .catch(e => res.status(500).json({
    message: 'Error Occured!',
    Stack: e.stack
  }));

  Promise.all([recentAdvertise, advertiseCount]).then(() => {
    res.status(200).json({
      message: 'Success',
      metadata: {
        currentPage: page,
        limit: limit,
        displaing: advertiseData.length,
        total: count,
        last_page: Math.ceil(count / limit)
      },
      data: advertiseData
    });
  })
  .catch(e => res.status(500).json({
    message: 'Error Occured!',
    Stack: e.stack
  }));


}

/*
---------------------------------------------------------
  show single advertise with details
---------------------------------------------------------
*/
exports.getSingleAdvertise = (req, res) => {

  const id = parseInt(req.params.id, 0);

  const result = Joi.validate({
    advertiseId: id
  }, validateId);

  if (!result.error){
    advertisesModel.singleAd(id).then((data) => {
      if (!data || data.length <= 0){
        res.status(404).json({
          message: 'Not Found!'
        });
      } else {
        res.status(200).json({
          message: 'Success', data: data
        });
      }
    })
    .catch(e => res.status(500).json({
      message: 'Error Occured!', Stack: e
    }));
  } else {
    res.status(400).json({
      message: 'Invalid Data!'
    });
  }
}

/*
---------------------------------------------------------
  search advertises in all categories
---------------------------------------------------------
*/
exports.searchAll = (req, res) => {

  const term = slug(req.params.term, ' ');

  console.log(term);

  const filterArray = [
    parseInt(req.query.minPrice, 0) || defaultMinPrice,
    parseInt(req.query.maxPrice, 0) || defaultMaxPrice
  ]

  advertisesModel.searchResult(term, ...filterArray)
  .then((data) => {
    if (!data || data.length <= 0){
      res.status(404).json({
        message: 'Not Found!'
      });
    } else {
      res.status(200).json({
        message: 'Success',
        length: data.length,
        data: data
      });
    }
  })
  .catch(e => res.status(500).json({
    message: 'Error Occured!', Stack: e
  }));
}

/*
---------------------------------------------------------
  search advertises in specific category
---------------------------------------------------------
*/
exports.searchInCategory = (req, res) => {

  let term;
  if (!req.query.term){
    term = null;
  } else {
    term = req.query.term;
  }

  const category = slug(req.params.categorName)

  const filterArray = [
    parseInt(req.query.minPrice, 0) || defaultMinPrice,
    parseInt(req.query.maxPrice, 0) || defaultMaxPrice
  ]

  advertisesModel.categorySearchResult(category, term, ...filterArray)
  .then((data) => {
    if (!data || data.length <= 0){
      res.status(404).json({
        message: 'Not Found!'
      });
    } else {
      res.status(200).json({
        message: 'Success',
        length: data.length,
        data: data
      });
    }
  })
  .catch(e => res.status(500).json({
    message: 'Error Occured!', Stack: e
  }));
}

/* Modify single Advertises by ID */
// exports.modifySingleAdvertise = (req, res) => {
//   res.status(500).json({ message: 'Error' });
// }

/* Delete  Advertises by ID */
exports.deleteSingleAdvertise = (req, res) => {

  const id = parseInt(req.params.id, 0);
  const userId = parseInt(req.session.passport.user.user_id, 0);

  const result = Joi.validate({ advertiseId: id }, validateId);

  if (result.error === null){
    advertisesModel.deleteAdvertise(id, userId).then((data) => {
      if (!data){
        res.status(404).json({
          message: 'Not Found!'
        });
      } else {
        res.status(200).json({
          message: 'Success', data: data
        });
      }
    })
    .catch(e => res.status(500).json({
      message: 'Error Occured!', Stack: e
    }));
  } else {
    res.status(400).json({
      message: 'Invalid Data!'
    });
  }
}
