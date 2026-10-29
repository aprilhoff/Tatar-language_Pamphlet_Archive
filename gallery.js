const grid = document.getElementById("grid");

fetch("data/manifest.json")
  .then((r) => {
    if (!r.ok) throw new Error("Could not load the archive list.");
    return r.json();
  })
  .then((items) => {
    grid.innerHTML = "";
    items.forEach((item) => {
      const a = document.createElement("a");
      a.className = "tile";
      a.href = `viewer.html?id=${encodeURIComponent(item.id)}`;

      const img = document.createElement("img");
      img.src = item.thumb;
      img.alt = item.title;
      img.loading = "lazy";

       const label = document.createElement("span");
      label.textContent = item.title;

      a.append(img, label);
      grid.appendChild(a);
    });
  })
  .catch((err) => {
    grid.textContent = err.message;
  });




// Target the window (or replace with your specific element, e.g., document.querySelector('.my-box'))
const scrollContainer = window; 
const scrollSpeed = 1; // Pixels per frame
let direction = 1;     // 1 means scrolling down, -1 means scrolling up

const autoScroll = setInterval(() => {
  // 1. Get current scroll metrics
  const currentScroll = window.scrollY; // Use scrollContainer.scrollTop for elements
  const visibleHeight = window.innerHeight; // Use scrollContainer.clientHeight for elements
  const totalHeight = document.documentElement.scrollHeight; // Use scrollContainer.scrollHeight for elements

  // 2. Perform the scroll movement
  scrollContainer.scrollBy(0, scrollSpeed * direction);

  // 3. Check if we hit the bottom (downward bounce)
  if (direction === 1 && (visibleHeight + currentScroll) >= totalHeight - 1) {
    direction = -1; // Reverse direction to go up
  }

  // 4. Check if we hit the top (upward bounce)
  if (direction === -1 && currentScroll <= 0) {
    direction = 1;  // Reverse direction to go down
  }
}, 10); // Runs roughly 100 times per second

// To stop the bouncing loop later:
// clearInterval(autoScroll);