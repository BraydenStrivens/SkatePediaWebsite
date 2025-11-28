/** 
  @fileoverview: This file contains functions used globally by all pages.
                These functions include the navigation bar functionality, ...
  @author: Brayden Strivens <bdstrivens@gmail.com>
  @version: 1.0.0
  @since: 11/03/2025
*/

/**
 * Navigation Bar Functionality Start
 */

const openSidebarButton = document.getElementById("openNavbarButton")
const navbar = document.getElementById("navbar")
const overlay = document.getElementById('overlay')
const media = window.matchMedia("(width < 750px)")

media.addEventListener("change", (e) => updateNavbar(e))
overlay.addEventListener('click', () => closeNavbar())

function openNavbar() {
  navbar.classList.add("show")
  openSidebarButton.setAttribute("aria-expanded", "true")
  navbar.removeAttribute("inert")
  
}

function closeNavbar() {
  navbar.classList.remove("show")
  openSidebarButton.setAttribute("aria-expanded", "false")
  navbar.setAttribute("inert", "")
}

function updateNavbar(e) {
  const isMobile = e.matches

  if (isMobile) {
    navbar.setAttribute("inert", "")
  } else {
    navbar.removeAttribute("inert")
  }
}

updateNavbar(media)

/**
 * Navigation Bar Functionality End
 */
