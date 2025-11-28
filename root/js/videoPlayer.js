/** 
  @fileoverview: This file contains functions for the video players in the home page.
  @author: Brayden Strivens <bdstrivens@gmail.com>
  @version: 1.0.0
  @since: 11/03/2025
*/



function toggleVideo(videoId, button) {
  const video = document.getElementById(videoId);
  const seekBar = document.getElementById(videoId + "Seek");
  const icon = button.querySelector("i");
  
  // Switches button icon according to the play state of the video
  if (video.paused) {
    video.play();

    icon.classList.remove("fa-play");
    icon.classList.add("fa-pause");

    button.setAttribute("data-state", "playing");
  } else {
    video.pause();

    icon.classList.remove("fa-pause");
    icon.classList.add("fa-play");

    button.setAttribute("data-state", "paused");
  }

  // Syncs the seek bar with video playback
  video.addEventListener("timeupdate", () => {
    seekBar.value = video.currentTime;

    if (video.currentTime >= video.duration) {
      video.currentTime = 0;
      video.pause();

      icon.classList.remove("fa-pause");
      icon.classList.add("fa-play");

      button.setAttribute("data-state", "paused");
    }
  });

  // Sets the seek bar's max length to the duration of the video when the video is loaded
  if (video.readyState === 4) {
    seekBar.max = video.duration;
  }
}

// Seeks the video to the specified value from the seek bar and pauses the video
function seekVideo(videoId, input) {
  const video = document.getElementById(videoId);

  video.currentTime = input.value;
}
