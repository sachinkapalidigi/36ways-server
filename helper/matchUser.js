const User = require("../models/User");
const uuid = require("uuid/v4");
var usersOnline = [];

const addUser = async (userId, socketId) => {
  // let data = null;

  let currentUser = await User.findById(userId)
    .then(res => res)
    .catch(err1 => err1);

  if (currentUser) {
    currentUser = { ...currentUser._doc, single: true, socketId };

    let { roomId, matchNotAvailable } = findMatch(currentUser);

    currentUser = { ...currentUser, roomId };
    // console.log(currentUser, "current user");
    matchNotAvailable
      ? (currentUser.single = true)
      : (currentUser.single = false);

    const existingUserIndex = usersOnline.indexOf(
      user1 => user1.email == currentUser.email
    );
    if (existingUserIndex !== -1) {
      usersOnline[existingUserIndex] = currentUser;
    } else {
      usersOnline.push(currentUser);
    }

    return { currentUser, err: null };
  }
  return { err: currentUser, currentUser: null };
};

const findMatch = currentUser => {
  let matchNotAvailable = true;
  let lookingFor = null;
  currentUser.gender == "male"
    ? (lookingFor = "female")
    : (lookingFor = "male");
  let matchedRoomId = null;
  usersOnline.forEach(user => {
    let { gender, location, single, roomId } = user;
    // matching and being matched
    // console.log(user, currentUser);

    if (
      gender == lookingFor &&
      location.toLowerCase() == currentUser.location.toLowerCase() &&
      single
    ) {
      user.single = false;
      matchNotAvailable = false;
      // console.log("came here atleast once", roomId);
      matchedRoomId = roomId;
      return { roomId: roomId, matchNotAvailable };
    }
  });
  if (matchNotAvailable) {
    return {
      roomId: uuid()
        .split("-")
        .join(""),
      matchNotAvailable
    };
  } else {
    return {
      roomId: matchedRoomId,
      matchNotAvailable
    };
  }
};

const getUser = id => usersOnline.find(user => user._id == id);

const getMatchedUsers = roomId =>
  usersOnline.filter(user => user.roomId == roomId);

// remove : 2 things remove from array and make other one single
// call when user disconnects
const removeUser = socketId => {
  const index = usersOnline.findIndex(user => user.socketId === socketId);

  if (index !== -1) {
    let leftRoomId = usersOnline[index].roomId;
    // console.log("before delete", usersOnline);
    usersOnline.splice(index, 1)[0];
    // console.log("after delete", usersOnline);
    usersOnline.forEach(user => {
      if (user.roomId == leftRoomId) {
        user.single = true;
      }
    });
  }
};

// unmatch and find new match

// const unmatchFindNew = roomId => {
//   let unmatchedUsersId = [];
//   usersOnline.forEach(user => {
//     if (user.roomId == roomId) {
//       user.single = true;
//       unmatchedUsersId.push(user.id);
//     }
//   });
//   return unmatchedUsersId;
// };

module.exports = { addUser, removeUser, getUser, getMatchedUsers };
