const { IgApiClient, IgCheckpointError } = require('instagram-private-api');
const asyncHandler = require('express-async-handler');
const Bluebird = require('bluebird');
const inquirer = require('inquirer');
const InsAccount = require('../model/instaModel');
const {
  instagramIdToUrlSegment,
  urlSegmentToInstagramId,
} = require('instagram-id-to-url-segment');
const fs = require('fs');
const axios = require('axios');
const InstaCategoryModel = require('../model/InstaCategoryModel');
// const ffmpeg = require('fluent-ffmpeg');

const getImage = async (url) => {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    const imageBuffer = Buffer.from(response.data, 'binary');
    return imageBuffer;
  } catch (error) {
    console.error(`Error fetching image: ${error.message}`);
    return null;
  }
};

const loginInsta = async (account) => {
  const ig = new IgApiClient();
  ig.state.generateDevice(account.username);
  if (account.proxy) {
    console.log('starting adding proxy', account.proxy);
    ig.state.proxyUrl = account.proxyurl;
    console.log('added proxy');
  }

  const accessToken = await ig.state.serializeCookieJar();

  const serialized = JSON.stringify(accessToken);

  // store the cookie somewhere

  try {
    console.log('🚀 Start loign')
    const auth = await ig.account.login(account.username, account.password);
    console.log("auth => ",auth);
    const data = await ig.account.currentUser();
    console.log("data => ",data);
    // console.log("🚀 ~ loginInsta ~ data:", data)
    const followers = await ig.feed.accountFollowers(data.pk).items();
    // console.log("🚀 ~ loginInsta ~ followers:", followers.length)
    const following = await ig.feed.accountFollowing(data.pk).items();
    // console.log("🚀 ~ loginInsta ~ following:", following.length)
    const userInfo = await ig.user.info(data.pk);
    // console.log("🚀 ~ loginInsta ~ userInfo:", userInfo)
    const location = "";
    // console.log("🚀 ~ loginInsta ~ location:", location)
    const imgBuff = await getImage(data.profile_pic_url);
    // console.log("🚀 ~ loginInsta ~ imgBuff:", imgBuff)

    // console.log(
    //   '🚀 ~ file: instaService.js:28 ~ exports.loginInsta=asyncHandler ~ data:',
    //   data
    // );

    console.log('🚀 End loign')
    return {
      status: 'success',
      auth: auth,
      ig: ig,
      data: data,
      followers: followers.length,
      following: following.length,
      location: location,
      imgBuff: imgBuff,
    };
  } catch (error) {
    console.error('Error during login:', error);
    return {
      status: 'error',
      message: `Error during login: ${error.message}`,
      stack: error.stack,
    };
  }
};

exports.checkProxy = asyncHandler(async (req, res, next) => {
  const bodyData = req.body;

  const ig = new IgApiClient();

  ig.state.generateDevice(bodyData.username);

  console.log('starting adding proxy', bodyData.proxy);
  ig.state.proxyUrl = "http://185.156.111.63:63974:7hx8w3bD:8URbKcS4";
  console.log('added proxy');

  try {

    const auth = await ig.account.login(bodyData.username, bodyData.password);

    return {
      status: 'success',
      auth: auth,
    };
  } catch (error) {
    console.error('Error during login:', error);
    return {
      status: 'error',
      message: `Error during login: ${error.message}`,
      stack: error.stack,
    };
  }
})

exports.check = asyncHandler(async (req, res, next) => {
  const response = [];

  let accounts = [];

  let errors = [];

  for (const account of req.body.accounts) {
    const acc = await InsAccount.findOne({ name: account.name });
    if (acc) {
      accounts.push(acc);
    } else {
      errors.push(`account ${account.name} not found in database`);
    }
  }

  if (accounts.length > 0) {
    for (const account of accounts) {
      const result = await loginInsta({
        username: account.name,
        password: account.password,
        proxy: account.proxy,
      });
      let oneResult = {
        status: '',
        user: '',
        message: '',
        biography: result.data?.biography,
        followers: result.followers,
        following: result.following,
        location: result.location,
        pk_id: result.data?.pk_id,
        imgBuff: result.imgBuff,
      };
      // console.log(result);
      // console.log('🚀 ~ exports.check=asyncHandler ~ result:', result);
      if (result.status === 'error') {
        errors.push(`error in login ${account.name} : ${result.message}`);
        const usernameNotFound =
          /The username you entered doesn't appear to belong to an account\./;
        oneResult.status = false;
        oneResult.user = account.name;
        let message = result.message;
        if (message.match(usernameNotFound)) {
          oneResult.message = 'اسم المسخدم او كلمة المرور خطأ';
        } else {
          oneResult.message = 'فشل الدخول';
        }
      } else {
        oneResult.status = true;
        oneResult.user = account.name;
        oneResult.message = 'تم الدخول بنجاح';
      }
      response.push(oneResult);
    }
  }

  // console.log('🚀 ~ exports.check=asyncHandler ~ accounts:', accounts);

  // console.log('🚀 ~ exports.check=asyncHandler ~ response:', response);

  // console.log('🚀 ~ exports.check=asyncHandler ~ errors:', errors);

  res.status(200).json({
    status: 'success',
    data: response,
    errors,
  });
});

exports.like = asyncHandler(async (req, res, next) => {
  console.log('🚀 ~ exports.like=asyncHandler ~ req:', req.body);

  var url = req.body.url;
  url = url.split('\n');
  console.log(url);
  let response = [];
  let urlCount = 1;
  for (const urlItem of url) {
    var post_id = urlItem.split('/')[4];
    console.log('🚀 ~ exports.like=asyncHandler ~ post_id:', post_id);
    let mediaId = await urlSegmentToInstagramId(post_id);
    console.log('🚀 ~ exports.like=asyncHandler ~ mediaId:', mediaId);

    const accountNames = req.body.accounts;
    for (const name of accountNames) {
      const account = await InsAccount.findOne({ name: name });

      console.log(
        '🚀 ~ exports.like=asyncHandler ~ account.name:',
        account.name
      );
      console.log(
        '🚀 ~ exports.like=asyncHandler ~ account.password:',
        account.password
      );

      const result = await loginInsta({
        username: account.name,
        password: account.password,
        proxy: account.proxy,
      });

      const auth = result.auth;
      const ig = result.ig;

      console.log('🚀 ~ exports.like=asyncHandler ~ auth:', auth);

      await ig.media
        .like({
          mediaId: mediaId,
          moduleInfo: {
            module_name: 'profile',
            user_id: auth.pk,
            username: auth.username,
          },
        })
        .then((res) => {
          response.push({
            status: 'success',
            user: account.name,
            message: 'تم اللايك بنجاح',
          });
        })
        .catch((err) => {
          let message;
          const hasBeenDeleted = /Sorry, this media has been deleted/;
          if (err.message.match(hasBeenDeleted)) {
            message = 'تم حذف المنشور' + urlCount;
          }
          response.push({
            status: 'error',
            user: account.name,
            message: message || 'فشل اللايك',
          });
        });
    }
    console.log('im counting', urlCount);
    urlCount++;
  }

  res.status(200).json(response);
});

exports.unLike = asyncHandler(async (req, res, next) => {
  console.log('🚀 ~ exports.unLike=asyncHandler ~ req:', req.body);

  var url = req.body.url;
  var post_id = url.split('/')[4];
  console.log('🚀 ~ exports.unLike=asyncHandler ~ post_id:', post_id);
  let mediaId = await urlSegmentToInstagramId(post_id);
  console.log('🚀 ~ exports.unLike=asyncHandler ~ mediaId:', mediaId);

  const accountNames = req.body.accounts;
  for (const name of accountNames) {
    const account = await InsAccount.findOne({ name: name });

    console.log(
      '🚀 ~ exports.unLike=asyncHandler ~ account.name:',
      account.name
    );
    console.log(
      '🚀 ~ exports.unLike=asyncHandler ~ account.password:',
      account.password
    );

    const result = await loginInsta({
      username: account.name,
      password: account.password,
      proxy: account.proxy,
    });

    const auth = result.auth;
    const ig = result.ig;

    console.log('🚀 ~ exports.unLike=asyncHandler ~ auth:', auth);

    await ig.media
      .unlike({
        mediaId: mediaId,
        moduleInfo: {
          module_name: 'profile',
          user_id: auth.pk,
          username: auth.username,
        },
      })
      .then((res) => {
        console.log('🚀 ~ exports.unLike=asyncHandler ~ res:', res);
      })
      .catch((err) => {
        console.log('🚀 ~ exports.unLike=asyncHandler ~ err:', err);
      });
  }

  res.status(200).json({
    status: 'success',
  });
});

exports.post = asyncHandler(async (req, res, next) => {
  console.log('🚀 ~ exports.post=asyncHandler HITTTTTTTTTTTTTT');
  const names = req.body.accounts;
  console.log('🚀 ~ exports.post=asyncHandler ~ account:', names);
  const files = req.files;
  let caption = files.csvFile[0].buffer.toString();
  let lines = caption.split('\n');

  let header = lines[0].split(',');
  let data = lines[1].split(',');

  let resultObject = {};

  for (let i = 0; i < header.length; i++) {
    let key = header[i].trim();
    let value = data[i].trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }

    if (value !== '') {
      resultObject[key] = value;
    }
  }
  // console.log("🚀 ~ exports.post=asyncHandler ~ resultObject:", resultObject)

  if (resultObject.mentions) {
    let mentionsArray = resultObject.mentions.split('//');
    resultObject.mentions = mentionsArray;
  }
  // console.log("🚀 ~ exports.post=asyncHandler ~ resultObject:", resultObject)

  const imgBuff = Buffer.from(files.images[0].buffer);
  // console.log("🚀 ~ exports.post=asyncHandler ~ imgBuff:", imgBuff)

  for (const name of names) {
    const acc = await InsAccount.findOne({ name: name });

    let account = {};
    if (acc) {
      account.username = acc.name;
      account.password = acc.password;
      account.proxy = acc.proxy;
    }

    caption = resultObject.caption;

    console.log(resultObject);

    const result = await post_insta(account, caption, imgBuff, resultObject.mentions, resultObject.locationId);
    // console.log('🚀 ~ exports.post=asyncHandler ~ result:', result);
  }
  res.status(200).json({
    status: 'success',
  });
});

exports.deletePost = asyncHandler(async (req, res, next) => {
  console.log('🚀 ~ exports.deletePost ~ req:', req.body);

  const accountName = req.body.accounts[0];

  const url = req.body.url;

  const post_id = url.split('/')[4];

  console.log('🚀 ~ exports.deletePost ~ post_id:', post_id);

  let mediaId = await urlSegmentToInstagramId(post_id);

  console.log('🚀 ~ exports.deletePost ~ mediaId:', mediaId);

  const acc = await InsAccount.findOne({ name: accountName });

  let account = {};

  if (acc) {
    account.username = acc.name;
    account.password = acc.password;
    account.proxy = acc.proxy;
  }

  const login_result = await loginInsta(account);

  const auth = login_result.auth;
  const ig = login_result.ig;

  await ig.media
    .delete({
      mediaId: mediaId,
    })
    .then((res) => {
      console.log('🚀 ~ exports.deletePost=asyncHandler ~ res:', res);
    })
    .catch((err) => {
      console.log('🚀 ~ exports.deletePost=asyncHandler ~ err:', err);
    });

  res.status(200).json({
    status: 'success',
  });
});

const post_insta = async (account, caption, imgBuff, mentions, locationId) => {

  const login_result = await loginInsta({
    username: account.username,
    password: account.password,
    proxy: account.proxy
  });

  const ig = login_result.ig;

  let usersToMentionPKs = [];

  for (const username of mentions) {
    const user = await ig.user.searchExact(username);
    const obj = {
      user_id: user.pk,
      position: [0.5, 0.5]
    }
    usersToMentionPKs.push(obj);
  }

  // Add mentions and location
  const params = {
    file: imgBuff,
    caption: caption,
    usertags: {
      in: usersToMentionPKs
    },
    location: locationId
  };
  console.log("🚀 ~ constpost_insta= ~ params:", params)

  // Post photo
  const result = await ig.publish.photo(params)
    .then((res) => {
      console.log('Posted photo', res);
      return res;
    })
    .catch((err) => {
      console.log('Error posting photo', err);
      return err;
    });

  return result;
};

exports.follow = asyncHandler(async (req, res, next) => {
  console.log('🚀 ~ exports.follow=asyncHandler ~ req:', req.body);

  const accountName = req.body.accounts[0];

  const usersToFollow = req.body.follow;

  const usersToFollowUsernames = usersToFollow.map((user) => {
    const url = user.split('/');
    const username = url[3];
    return username;
  });

  console.log(
    '🚀 ~ usersToFollowUsernames ~ usersToFollowUsernames:',
    usersToFollowUsernames
  );

  const acc = await InsAccount.findOne({ name: accountName });

  let account = {};

  if (acc) {
    account.username = acc.name;
    account.password = acc.password;
    account.proxy = acc.proxy;
  }

  const login_result = await loginInsta(account);

  const auth = login_result.auth;
  const ig = login_result.ig;

  // loop through usersToFollowUsernames
  for (const username of usersToFollow) {
    // get user id
    const user = await ig.user.searchExact(username);
    console.log('🚀 ~ exports.follow=asyncHandler ~ user:', user);

    // follow
    await ig.friendship
      .create(user.pk)
      .then((res) => {
        console.log('🚀 ~ exports.follow=asyncHandler ~ res:', res);
      })
      .catch((err) => {
        console.log('🚀 ~ exports.follow=asyncHandler ~ err:', err);
      });
  }

  res.status(200).json({
    status: 'success',
  });
});

exports.unFollow = asyncHandler(async (req, res, next) => {
  console.log('🚀 ~ exports.unFollow=asyncHandler ~ req:', req.body);

  const accountName = req.body.accounts[0];

  const usersToFollow = req.body.follow;

  const usersToFollowUsernames = usersToFollow.map((user) => {
    const url = user.split('/');
    const username = url[3];
    return username;
  });

  console.log(
    '🚀 ~ usersToFollowUsernames ~ usersToFollowUsernames:',
    usersToFollowUsernames
  );

  const acc = await InsAccount.findOne({ name: accountName });

  let account = {};

  if (acc) {
    account.username = acc.name;
    account.password = acc.password;
    account.proxy = acc.proxy;
  }

  const login_result = await loginInsta(account);

  const auth = login_result.auth;
  const ig = login_result.ig;

  // loop through usersToFollowUsernames
  for (const username of usersToFollow) {
    // get user id
    const user = await ig.user.searchExact(username);
    console.log('🚀 ~ exports.unFollow=asyncHandler ~ user:', user);

    // follow
    await ig.friendship
      .destroy(user.pk)
      .then((res) => {
        console.log('🚀 ~ exports.unFollow=asyncHandler ~ res:', res);
      })
      .catch((err) => {
        console.log('🚀 ~ exports.unFollow=asyncHandler ~ err:', err);
      });
  }

  res.status(200).json({
    status: 'success',
  });
});


exports.reel = asyncHandler(async (req, res, next) => {
  const names = req.body.accounts;
  console.log("🚀 ~ exports.reel=asyncHandler ~ req.body:", req.body)
  const files = req.files;
  console.log("🚀 ~ exports.reel=asyncHandler ~ req.files:", req.files)
  const videos = files.images;
  const imgBuff = Buffer.from(files.csvFile[0].buffer);

  let errors = [];

  for (let index = 0; index < names.length; index++) {
    const name = names[index];
    const video = videos[index];
    const acc = await InsAccount.findOne({ name: name });

    let account = {};
    if (acc) {
      account.username = acc.name;
      account.password = acc.password;
      account.proxy = acc.proxy;
    }

    const loginResult = await loginInsta(account);

    const ig = loginResult.ig;

    const videoBuff = Buffer.from(video.buffer);
    // const firstFrame = videoBuff.slice(0, 100000);
    // console.log("🚀 ~ exports.reel=asyncHandler ~ firstFrame:", firstFrame)

    console.log("🚀 ~ Start add Reel")
    try {
      const reel = await ig.publish.video({
        video: videoBuff,
        coverImage: imgBuff,
      });
    } catch (error) {
      errors.push(error);
      console.log("🚀 ~ exports.reel=asyncHandler ~ error:", error)
    }
    console.log("🚀 ~ End add Reel")
  }

  if (errors.length < 0) {
    res.status(200).json({
      status: 'success',
    });
  }
  // bad request
  res.status(400).json(errors);
});

exports.story = asyncHandler(async (req, res, next) => {
  const names = req.body.accounts;
  // console.log('🚀 ~ exports.post=asyncHandler ~ account:', names);
  const files = req.files;
  // let caption = files.csvFile[0].buffer.toString();
  // let lines = caption.split('\n');
  // console.log("🚀 ~ exports.story=asyncHandler ~ lines:", lines)

  let resultObject = {};

  for (let index = 0; index < names.length; index++) {
    const name = names[index];
    console.log("🚀 ~ exports.story=asyncHandler ~ name:", name)
    // const line = lines[index + 1];
    // console.log("🚀 ~ exports.story=asyncHandler ~ line:", line)
    // const caption = line.split(',')[0];
    // const locationId = line.split(',')[1];
    // let mentions = line.split(',')[2];
    // if (mentions) {
    //   mentions = mentions.split('//');
    // }
    const imgBuff = Buffer.from(files.images[index].buffer);
    const acc = await InsAccount.findOne({ name: name });

    let account = {};
    if (acc) {
      account.username = acc.name;
      account.password = acc.password;
      account.proxy = acc.proxy;
    }

    const loginResult = await loginInsta(account);

    const ig = loginResult.ig;

    const story = await ig.publish.story({
      file: imgBuff,
    });

    console.log("🚀 ~ exports.story=asyncHandler ~ story:", story)
  }

  res.status(200).json({
    status: 'success',
  });
});



exports.deleteReel = asyncHandler(async (req, res, next) => {
  console.log("🚀 ~ exports.deleteReel=asyncHandler ~ req:", req.body)

})

exports.deleteStory = asyncHandler(async (req, res, next) => {
  console.log("🚀 ~ exports.deleteStory=asyncHandler ~ req:", req.body)

  const names = req.body.accounts;

  const numberForStoryNeedToDelete = req.body.count;

  for (const name of names) {
    const acc = await InsAccount.findOne({ name: name });

    let account = {};
    if (acc) {
      account.username = acc.name;
      account.password = acc.password;
      account.proxy = acc.proxy;
    }

    const loginResult = await loginInsta(account);

    const ig = loginResult.ig;

    const stories = await ig.feed.reelsTray().items();

    const media_ids = stories[0].media_ids;

    console.log("🚀 ~ exports.deleteStory ~ stories:", media_ids)

    // start delete by numberForStoryNeedToDelete

    for (let index = 0; index < numberForStoryNeedToDelete; index++) {
      const storyMediaId = media_ids[index];

      try {
        await ig.media.delete({
          mediaId: storyMediaId,
        });
      }
      catch (error) {
        console.log("🚀 ~ exports.deleteStory ~ error:", error)
      }
    }
  }

  res.status(200).json({
    status: 'success',
  });
})

exports.updateAccount = asyncHandler(async (req, res, next) => {
  // handel formData
  const userId = req.params.id;
  const { name, password, description, category } = req.body;
  let img = null;
  if (req.files.images && req.files.images.length > 0) {
    img = req.files.images[0];
  }
  let errors = [];
  if (category && category !== "") {
    console.log("🚀 Going to update Category");
    const category = await InstaCategoryModel.findOne({ name: category });

    if (!category) {
      const categoryId = category._id;
      await InsAccount.findByIdAndUpdate(userId, { Category: categoryId });
    } else {
      errors.push("Category not found");
    }
  }

  if (img && img.buffer) {
    const acc = await InsAccount.findById(userId);

    let account = {};
    if (acc) {
      account.username = acc.name;
      account.password = acc.password;
      account.proxy = acc.proxy;
    }

    const loginResult = await loginInsta(account);

    const ig = loginResult.ig;

    const imgBuff = Buffer.from(img.buffer);

    // update profile picture
    console.log("🚀 Going to update Profile Picture");
    try {
      await ig.account.changeProfilePicture(imgBuff);
    } catch (error) {
      errors.push("Error during update profile picture");
      console.log("🚀 ~ exports.updateAccount=asyncHandler ~ error:", error)
    }
  }

  if (
    (name && name !== "") ||
    (password && password !== "") ||
    (description && description !== "")) {

    const acc = await InsAccount.findById(userId);

    let account = {};
    if (acc) {
      account.username = acc.name;
      account.password = acc.password;
      account.proxy = acc.proxy;
    }

    const loginResult = await loginInsta(account);

    const ig = loginResult.ig;

    if (name && name !== "") {
      console.log("🚀 ~ exports.updateAccount=asyncHandler ~ name:", name)
      console.log("🚀 Going to update Name");

      try {
        await ig.account.editProfile({
          first_name: name
        });
      } catch (error) {
        errors.push("Error during update name");
        console.log("🚀 ~ exports.updateAccount=asyncHandler ~ error:", error)
      }
    }

    if (password && password !== "") {
      console.log("🚀 Going to update Password");
      console.log("password", password)
      const oldPassword = account.password.toString()
      const newPassword = password.toString()
      try {
        await ig.account.changePassword(oldPassword, newPassword);
        await InsAccount.findByIdAndUpdate(userId, { password: password });
      } catch (error) {
        errors.push("Error during update password");
        console.log("🚀 ~ exports.updateAccount=asyncHandler ~ error:", error)
      }
    }

    if (description && description !== "" && description !== "<p><br></p>" && description !== "undefined") {
      console.log("🚀 Going to update Description");
      console.log("🚀 ~ exports.updateAccount=asyncHandler ~ description:", description)
      let newDescription = description;
      newDescription = newDescription.replace(/<p>/g, '');
      newDescription = newDescription.replace(/<\/p>/g, '');
      newDescription = newDescription.replace(/<br>/g, '');
      console.log("🚀 ~ exports.updateAccount=asyncHandler ~ newDescription:", newDescription)
      try {
        await ig.account.setBiography(newDescription)
      } catch (error) {
        errors.push("Error during update description");
        console.log("🚀 ~ exports.updateAccount=asyncHandler ~ error:", error)
      }
    }
  }

  const allErrors = errors.join(", ");

  res.status(200).json({
    message: allErrors,
    errors: errors
  });
})