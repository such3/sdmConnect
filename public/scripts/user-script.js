// Open and close the profile edit modal
document
  .getElementById("editProfileBtn")
  .addEventListener("click", function () {
    document.getElementById("editProfileModal").classList.remove("hidden");
  });

document
  .getElementById("closeProfileModal")
  .addEventListener("click", function () {
    document.getElementById("editProfileModal").classList.add("hidden");
  });

// Open and close the resource edit modal
const editResourceBtns = document.querySelectorAll('[id^="editResourceBtn"]');
const closeResourceModal = document.getElementById("closeResourceModal");

// Attach event listeners to all Edit Resource buttons
editResourceBtns.forEach((btn) => {
  btn.addEventListener("click", function () {
    document.getElementById("editResourceModal").classList.remove("hidden");
  });
});

closeResourceModal.addEventListener("click", function () {
  document.getElementById("editResourceModal").classList.add("hidden");
});
