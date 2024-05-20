"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const storyId = story.storyId;
  const starMarkup = getStarMarkup(storyId);

  return $(`
    <li id="${storyId}">
      ${starMarkup}
      <a href="${story.url}" target="_blank" class="story-link">
        ${story.title}
      </a>
      <small class="story-hostname">(${hostName})</small>
      <small class="story-author">by ${story.author}</small>
      <small class="story-user">posted by ${story.username}</small>
    </li>
  `);

  function getStarMarkup(storyId) {
    if (currentUser) {
      const isFavorite = currentUser.favorites.some(
        (fav) => fav.storyId === storyId
      );
      const starClass = isFavorite ? "fas" : "far";
      return `<span class="fav-star"><i class="fa-star ${starClass}"></i></span>`;
    }
    return "";
  }
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

async function putStoriesOnPage() {
  storyList = await StoryList.getStories();

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

async function submitNewStory(evt) {
  console.debug("submitNewStory");
  evt.preventDefault();

  const $createAuthor = $("#create-author").val();
  const $createTitle = $("#create-title").val();
  const $createUrl = $("#create-url").val();
  const username = currentUser.username;
  const newStoryData = {
    title: $createTitle,
    author: $createAuthor,
    url: $createUrl,
    username: username,
  };

  const story = await storyList.addStory(currentUser, newStoryData);
  const $story = await generateStoryMarkup(story);
  $allStoriesList.prepend($story);
}

$submitForm.on("submit", submitNewStory);

function putOwnStoriesOnPage() {
  hidePageComponents();

  // loop through all user favorite stories and generate HTML for them
  $myStoriesList.empty();

  if (currentUser.ownStories.length === 0) {
    $myStoriesList.append(
      `<a href="#" onclick="navSubmitStoryClick()"><h5>No stories added! Click here to add a story.</h5></a>`
    );
  } else {
    // loop through all of users favorites and generate HTML for them
    for (let story of currentUser.ownStories) {
      const $story = generateStoryMarkup(story);
      $story.prepend(
        `<span class="delete-story"><i class="fas fa-trash-alt"></i></span>`
      );
      $myStoriesList.append($story);
    }
  }

  $myStoriesList.show();
}

$navMyStories.on("click", putOwnStoriesOnPage);

async function removeMyStory(evt) {
  evt.preventDefault();

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = currentUser.ownStories.find((s) => s.storyId === storyId);

  $closestLi.remove();
  currentUser.removeUserStory(story);
  putOwnStoriesOnPage();
}

$myStoriesList.on("click", ".fa-trash-alt", removeMyStory);

function putFavStoriesOnPage() {
  hidePageComponents();

  // loop through all user favorite stories and generate HTML for them
  $favStoriesList.empty();

  if (currentUser.favorites.length === 0) {
    $favStoriesList.append(
      `<a href="#" onclick="navAllStories()"><h5>No favorites added! Click here to view all stories.</h5></a>`
    );
  } else {
    // loop through all of users favorites and generate HTML for them
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favStoriesList.append($story);
    }
  }

  $favStoriesList.show();
}

$navFavorites.on("click", putFavStoriesOnPage);

async function favoriteStory(evt) {
  evt.preventDefault();

  const $tgt = $(evt.target);
  const $closestLi = $tgt.closest("li");
  const liClass = $tgt.attr("class");
  const storyId = $closestLi.attr("id");
  const $iElement = $closestLi.find("i.fa-star");
  const story = storyList.stories.find((s) => s.storyId === storyId);

  if (liClass === "fa-star far") {
    currentUser.addFavoriteStory(story);
    $iElement.removeClass("far").addClass("fas");
  } else {
    currentUser.removeFavoriteStory(story);
    $iElement.removeClass("fas").addClass("far");
  }
}

$storiesLists.on("click", ".fav-star", favoriteStory);
