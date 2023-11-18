const observer = new IntersectionObserver(entries => {
    // Loop over the entries
    entries.forEach(entry => {

    const target = entry.target.querySelector('.projectsContainer');
      // If the element is visible
      if (entry.isIntersecting) {
        // Add the animation class
        target.classList.add('slideIn');
        return
      }
      target.classList.remove('slideIn');
    });
  });
  

//   observer.observe(document.querySelector('.projectsWrapper'));

const targets = document.querySelectorAll('.projectsWrapper');
for (const target of targets) {
    observer.observe(target);
}