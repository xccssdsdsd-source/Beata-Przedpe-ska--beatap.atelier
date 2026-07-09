import { animate, createTimeline, stagger, splitText } from 'animejs'

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const nav = document.querySelector('.nav')
const heroTexture = document.querySelector('.hero__texture')
const revealItems = [...document.querySelectorAll('[data-reveal]')]
const works = [...document.querySelectorAll('.work')]
const lightbox = document.querySelector('.lightbox')
const lightboxImage = document.querySelector('.lightbox__image')
const lightboxCount = document.querySelector('[data-lightbox-count]')
const closeButton = document.querySelector('[data-close]')
const prevButton = document.querySelector('[data-prev]')
const nextButton = document.querySelector('[data-next]')
const contactForm = document.querySelector('[data-contact-form]')
const contactFormNote = document.querySelector('[data-contact-form-note]')
const navToggle = document.querySelector('[data-menu-open]')
const menuCloseButton = document.querySelector('[data-menu-close]')
const mobileNav = document.querySelector('.mobile-nav')
const mobileNavBackdrop = document.querySelector('[data-menu-backdrop]')
const mobileNavLinks = [...document.querySelectorAll('.mobile-nav__links a')]

let activeIndex = 0
let lastFocusedElement = null
let lastFocusedNavToggle = null

// ---------------------------------------------------------------------------
// Nav scroll state + hero parallax
// ---------------------------------------------------------------------------

const syncNav = () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 24)
  if (!prefersReducedMotion && heroTexture) {
    heroTexture.style.setProperty('--parallax', `${window.scrollY * .08}px`)
  }
}

// ---------------------------------------------------------------------------
// Hero entrance
// ---------------------------------------------------------------------------

const runHeroEntrance = () => {
  const brand = document.querySelector('.hero__brand')
  const headline = document.querySelector('[data-hero-headline]')
  const copy = document.querySelector('.hero__copy')

  if (prefersReducedMotion) {
    if (brand) brand.style.opacity = 1
    if (headline) headline.style.opacity = 1
    if (copy) copy.style.opacity = 1
    return
  }

  const tl = createTimeline({ defaults: { ease: 'outQuart' } })

  tl.add(brand, {
    opacity: [0, 1],
    translateY: [-14, 0],
    duration: 900
  }, 0)

  if (headline) {
    const { words } = splitText(headline, { words: true })
    headline.style.opacity = 1
    tl.add(words, {
      opacity: [0, 1],
      translateY: [46, 0],
      filter: ['blur(9px)', 'blur(0px)'],
      duration: 1000,
      delay: stagger(70),
      ease: 'outExpo'
    }, 260)
  }

  if (copy) {
    tl.add(copy, {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 900
    }, headline ? 720 : 260)
  }
}

// ---------------------------------------------------------------------------
// Scroll reveals — batches intersections that land in the same frame so
// related elements (gallery cards, process steps…) cascade instead of
// popping in all at once.
// ---------------------------------------------------------------------------

const revealBatch = new Set()
let revealFlushHandle = null

const flushRevealBatch = () => {
  revealFlushHandle = null
  const items = [...revealBatch]
  revealBatch.clear()
  if (!items.length) return

  if (prefersReducedMotion) {
    items.forEach(item => { item.style.opacity = 1 })
    return
  }

  animate(items, {
    opacity: [0, 1],
    translateY: [30, 0],
    scale: [.98, 1],
    duration: 950,
    delay: stagger(90),
    ease: 'outExpo'
  })
}

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return
    revealObserver.unobserve(entry.target)
    revealBatch.add(entry.target)
  })
  if (!revealFlushHandle) {
    revealFlushHandle = window.requestAnimationFrame(flushRevealBatch)
  }
}, { threshold: .16, rootMargin: '0px 0px -8% 0px' })

revealItems.forEach(item => {
  item.style.opacity = 0
  revealObserver.observe(item)
})

// ---------------------------------------------------------------------------
// Gallery lightbox
// ---------------------------------------------------------------------------

const showWork = (index, { instant = false } = {}) => {
  activeIndex = (index + works.length) % works.length
  const work = works[activeIndex]
  const src = work.dataset.src
  const alt = work.querySelector('img').alt

  if (prefersReducedMotion || instant) {
    lightboxImage.src = src
    lightboxImage.alt = alt
    lightboxCount.textContent = `${activeIndex + 1} / ${works.length}`
    return
  }

  animate(lightboxImage, {
    opacity: [1, 0],
    scale: [1, .97],
    duration: 200,
    ease: 'inQuad',
    onComplete: () => {
      lightboxImage.src = src
      lightboxImage.alt = alt
      lightboxCount.textContent = `${activeIndex + 1} / ${works.length}`
      animate(lightboxImage, {
        opacity: [0, 1],
        scale: [.97, 1],
        duration: 380,
        ease: 'outQuart'
      })
    }
  })
}

const openLightbox = index => {
  lastFocusedElement = document.activeElement
  showWork(index, { instant: true })
  lightbox.classList.add('is-open')
  lightbox.setAttribute('aria-hidden', 'false')
  document.body.style.overflow = 'hidden'
  closeButton.focus()

  if (!prefersReducedMotion) {
    animate(lightboxImage, {
      opacity: [0, 1],
      scale: [.94, 1],
      duration: 480,
      ease: 'outExpo'
    })
    animate([closeButton, lightboxCount, prevButton, nextButton], {
      opacity: [0, 1],
      translateY: [-8, 0],
      duration: 420,
      delay: stagger(50),
      ease: 'outQuart'
    })
  }
}

const closeLightbox = () => {
  lightbox.classList.remove('is-open')
  lightbox.setAttribute('aria-hidden', 'true')
  document.body.style.overflow = ''
  lightboxImage.removeAttribute('src')
  if (lastFocusedElement) lastFocusedElement.focus()
}

const trapFocus = event => {
  if (!lightbox.classList.contains('is-open') || event.key !== 'Tab') return
  const focusable = [...lightbox.querySelectorAll('button')]
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

// ---------------------------------------------------------------------------
// Mobile nav
// ---------------------------------------------------------------------------

const openMobileNav = () => {
  lastFocusedNavToggle = document.activeElement
  mobileNav.classList.add('is-open')
  mobileNav.setAttribute('aria-hidden', 'false')
  navToggle.setAttribute('aria-expanded', 'true')
  document.body.style.overflow = 'hidden'
  menuCloseButton.focus()

  if (!prefersReducedMotion) {
    animate(mobileNavLinks, {
      opacity: [0, 1],
      translateX: [28, 0],
      duration: 520,
      delay: stagger(70, { start: 120 }),
      ease: 'outExpo'
    })
  }
}

const closeMobileNav = () => {
  mobileNav.classList.remove('is-open')
  mobileNav.setAttribute('aria-hidden', 'true')
  navToggle.setAttribute('aria-expanded', 'false')
  document.body.style.overflow = ''
  mobileNavLinks.forEach(link => { link.style.opacity = 0 })
  if (lastFocusedNavToggle) lastFocusedNavToggle.focus()
}

const trapMobileNavFocus = event => {
  if (!mobileNav.classList.contains('is-open') || event.key !== 'Tab') return
  const focusable = [menuCloseButton, ...mobileNavLinks]
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

runHeroEntrance()

works.forEach((work, index) => work.addEventListener('click', () => openLightbox(index)))
closeButton.addEventListener('click', closeLightbox)
prevButton.addEventListener('click', () => showWork(activeIndex - 1))
nextButton.addEventListener('click', () => showWork(activeIndex + 1))
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) closeLightbox()
})

contactForm.addEventListener('submit', event => {
  event.preventDefault()
  contactFormNote.hidden = false
  contactForm.reset()
  if (!prefersReducedMotion) {
    animate(contactFormNote, {
      opacity: [0, 1],
      translateY: [-6, 0],
      duration: 480,
      ease: 'outQuart'
    })
  }
})

navToggle.addEventListener('click', openMobileNav)
menuCloseButton.addEventListener('click', closeMobileNav)
mobileNavBackdrop.addEventListener('click', closeMobileNav)
mobileNavLinks.forEach(link => link.addEventListener('click', closeMobileNav))

window.addEventListener('scroll', syncNav, { passive: true })
window.addEventListener('keydown', event => {
  if (mobileNav.classList.contains('is-open')) {
    if (event.key === 'Escape') closeMobileNav()
    trapMobileNavFocus(event)
  }
  if (!lightbox.classList.contains('is-open')) return
  if (event.key === 'Escape') closeLightbox()
  if (event.key === 'ArrowLeft') showWork(activeIndex - 1)
  if (event.key === 'ArrowRight') showWork(activeIndex + 1)
  trapFocus(event)
})

syncNav()
