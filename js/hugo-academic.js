/*************************************************
 *  Academic: the personal website framework for Hugo.
 *  https://github.com/gcushen/hugo-academic
 **************************************************/

(function($){

  /* ---------------------------------------------------------------------------
   * Responsive scrolling for URL hashes.
   * --------------------------------------------------------------------------- */

  // Dynamically get responsive navigation bar offset.
  let $navbar = $('.navbar-header');
  let navbar_offset = $navbar.innerHeight();

  /**
   * Responsive hash scrolling.
   * Check for a URL hash as an anchor.
   * If it exists on current page, scroll to it responsively.
   * If `target` argument omitted (e.g. after event), assume it's the window's hash.
   */
  function scrollToAnchor(target) {
    // If `target` is undefined or HashChangeEvent object, set it to window's hash.
    target = (typeof target === 'undefined' || typeof target === 'object') ? window.location.hash : target;
    // Escape colons from IDs, such as those found in Markdown footnote links.
    target = target.replace(/:/g, '\\:');

    // If target element exists, scroll to it taking into account fixed navigation bar offset.
    if($(target).length) {
      $('body').addClass('scrolling');
      $('html, body').animate({
        scrollTop: $(target).offset().top - navbar_offset
      }, 600, function () {
        $('body').removeClass('scrolling');
      });
    }
  }

  // Make Scrollspy responsive.
  function fixScrollspy() {
    let $body = $('body');
    let data = $body.data('bs.scrollspy');
    if (data) {
      data.options.offset = navbar_offset;
      $body.data('bs.scrollspy', data);
      $body.scrollspy('refresh');
    }
  }

  // Check for hash change event and fix responsive offset for hash links (e.g. Markdown footnotes).
  window.addEventListener("hashchange", scrollToAnchor);

  /* ---------------------------------------------------------------------------
   * Add smooth scrolling to all links inside the main navbar.
   * --------------------------------------------------------------------------- */

  $('#navbar-main li.nav-item a').on('click', function(event) {
    // Store requested URL hash.
    let hash = this.hash;

    // If we are on the homepage and the navigation bar link is to a homepage section.
    if ( hash && $(hash).length && ($("#homepage").length > 0)) {
      // Prevent default click behavior.
      event.preventDefault();

      // Use jQuery's animate() method for smooth page scrolling.
      // The numerical parameter specifies the time (ms) taken to scroll to the specified hash.
      $('html, body').animate({
        scrollTop: $(hash).offset().top - navbar_offset
      }, 800);
    }
  });

  /* ---------------------------------------------------------------------------
   * Smooth scrolling for Back To Top link.
   * --------------------------------------------------------------------------- */

  $('#back_to_top').on('click', function(event) {
    event.preventDefault();
    $('html, body').animate({
      'scrollTop': 0
    }, 800, function() {
      window.location.hash = "";
    });
  });

  /* ---------------------------------------------------------------------------
   * Hide mobile collapsable menu on clicking a link.
   * --------------------------------------------------------------------------- */

  $(document).on('click', '.navbar-collapse.in', function(e) {
    //get the <a> element that was clicked, even if the <span> element that is inside the <a> element is e.target
    let targetElement = $(e.target).is('a') ? $(e.target) : $(e.target).parent();

    if (targetElement.is('a') && targetElement.attr('class') != 'dropdown-toggle') {
      $(this).collapse('hide');
    }
  });

  /* ---------------------------------------------------------------------------
   * Filter publications.
   * --------------------------------------------------------------------------- */

  let $grid_pubs = $('#container-publications');
  $grid_pubs.isotope({
    itemSelector: '.isotope-item',
    percentPosition: true,
    masonry: {
      // Use Bootstrap compatible grid layout.
      columnWidth: '.grid-sizer'
    }
  });

  // Active publication filters.
  let pubFilters = {};

  // Flatten object by concatenating values.
  function concatValues( obj ) {
    let value = '';
    for ( let prop in obj ) {
      value += obj[ prop ];
    }
    return value;
  }

  $('.pub-filters').on( 'change', function() {
    let $this = $(this);

    // Get group key.
    let filterGroup = $this[0].getAttribute('data-filter-group');

    // Set filter for group.
    pubFilters[ filterGroup ] = this.value;

    // Combine filters.
    let filterValues = concatValues( pubFilters );

    // Activate filters.
    $grid_pubs.isotope({ filter: filterValues });

    // If filtering by publication type, update the URL hash to enable direct linking to results.
    if (filterGroup == "pubtype") {
      // Set hash URL to current filter.
      let url = $(this).val();
      if (url.substr(0, 9) == '.pubtype-') {
        window.location.hash = url.substr(9);
      } else {
        window.location.hash = '';
      }
    }
  });

  // Filter publications according to hash in URL.
  function filter_publications() {
    let urlHash = window.location.hash.replace('#','');
    let filterValue = '*';

    // Check if hash is numeric.
    if (urlHash != '' && !isNaN(urlHash)) {
      filterValue = '.pubtype-' + urlHash;
    }

    // Set filter.
    let filterGroup = 'pubtype';
    pubFilters[ filterGroup ] = filterValue;
    let filterValues = concatValues( pubFilters );

    // Activate filters.
    $grid_pubs.isotope({ filter: filterValues });

    // Set selected option.
    $('.pubtype-select').val(filterValue);
  }

  /* ---------------------------------------------------------------------------
  * Google Maps or OpenStreetMap via Leaflet.
  * --------------------------------------------------------------------------- */

  function initMap () {
    if ($('#map').length) {
      let map_provider = $('#map-provider').val();
      let lat = $('#map-lat').val();
      let lng = $('#map-lng').val();
      let zoom = parseInt($('#map-zoom').val());
      let address = $('#map-dir').val();
      let api_key = $('#map-api-key').val();
      
      if ( map_provider == 1 ) {
        let map = new GMaps({
          div: '#map',
          lat: lat,
          lng: lng,
          zoom: zoom,
          zoomControl: true,
          zoomControlOpt: {
            style: 'SMALL',
            position: 'TOP_LEFT'
          },
          panControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          overviewMapControl: false,
          scrollwheel: true,
          draggable: true
        });

        map.addMarker({
          lat: lat,
          lng: lng,
          click: function (e) {
            let url = 'https://www.google.com/maps/place/' + encodeURIComponent(address) + '/@' + lat + ',' + lng +'/';
            window.open(url, '_blank')
          },
          title: address
        })
      } else {
          let map = new L.map('map').setView([lat, lng], zoom);
          if ( map_provider == 3 && api_key.length ) {
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
              attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
              maxZoom: 18,
              id: 'mapbox.streets',
              accessToken: api_key
            }).addTo(map);
          } else {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            }).addTo(map);
          }
          let marker = L.marker([lat, lng]).addTo(map);
          let url = lat + ',' + lng +'#map='+ zoom +'/'+ lat +'/'+ lng +'&layers=N';
          marker.bindPopup(address + '<p><a href="https://www.openstreetmap.org/directions?engine=osrm_car&route='+ url +'">Routing via OpenStreetMap</a></p>');
      }
    }
  }

  /* ---------------------------------------------------------------------------
   * On window load.
   * --------------------------------------------------------------------------- */

  $(window).on('load', function() {
    if (window.location.hash) {
      // When accessing homepage from another page and `#top` hash is set, show top of page (no hash).
      if (window.location.hash == "#top") {
        window.location.hash = ""
      } else {
        // If URL contains a hash, scroll to target ID taking into account responsive offset.
        scrollToAnchor();
      }
    }

    // Initialize Scrollspy.
    let $body = $('body');
    $body.scrollspy({offset: navbar_offset });

    // Call `fixScrollspy` when window is resized.
    let resizeTimer;
    $(window).resize(function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fixScrollspy, 200);
    });

    // Filter projects.
    $('.projects-container').each(function(index, container) {
      let $container = $(container);
      let $section = $container.closest('section');
      let layout = 'masonry';
      if ($section.find('.isotope').hasClass('js-layout-row')) {
        layout = 'fitRows';
      }

      $container.imagesLoaded(function() {
        // Initialize Isotope after all images have loaded.
        $container.isotope({
          itemSelector: '.isotope-item',
          layoutMode: layout,
          filter: $section.find('.default-project-filter').text()
        });
        // Filter items when filter link is clicked.
        $section.find('.project-filters a').click(function() {
          let selector = $(this).attr('data-filter');
          $container.isotope({filter: selector});
          $(this).removeClass('active').addClass('active').siblings().removeClass('active all');
          return false;
        });
      });
    });

    // Enable publication filter for publication index page.
    if ($('.pub-filters-select')) {
      filter_publications();
      // Useful for changing hash manually (e.g. in development):
      // window.addEventListener('hashchange', filter_publications, false);
    }

    // Load citation modal on 'Cite' click.
    $('.js-cite-modal').click(function(e) {
      e.preventDefault();
      let filename = $(this).attr('data-filename');
      let modal = $('#modal');
      modal.find('.modal-body').load( filename , function( response, status, xhr ) {
        if ( status == 'error' ) {
          let msg = "Error: ";
          $('#modal-error').html( msg + xhr.status + " " + xhr.statusText );
        } else {
          $('.js-download-cite').attr('href', filename);
        }
      });
      modal.modal('show');
    });

    // Copy citation text on 'Copy' click.
    $('.js-copy-cite').click(function(e) {
      e.preventDefault();
      // Get selection.
      let range = document.createRange();
      let code_node = document.querySelector('#modal .modal-body');
      range.selectNode(code_node);
      window.getSelection().addRange(range);
      try {
        // Execute the copy command.
        document.execCommand('copy');
      } catch(e) {
        console.log('Error: citation copy failed.');
      }
      // Remove selection.
      window.getSelection().removeRange(range);
    });

    // Initialise Google Maps if necessary.
    initMap();
  });

})(jQuery);

/* ---------------------------------------------------------------------------
 * Custom homepage section: Desarrollo de herramientas web.
 * --------------------------------------------------------------------------- */

(function($) {
  $(function() {
    if (!$('#homepage').length) {
      return;
    }

    let sectionHtml = `
      <section id="herramientas-web" class="home-section">
        <div class="container">
          <div class="row">
            <div class="col-xs-12 col-md-4 section-heading">
              <h1>Desarrollo de herramientas web</h1>
              <p>Plataformas interactivas para estadística aplicada, docencia e investigación.</p>
            </div>
            <div class="col-xs-12 col-md-8">
              <p>
                Diseño y desarrollo plataformas web para apoyar la enseñanza de la estadística,
                la simulación de modelos, el análisis reproducible de datos y la toma de decisiones
                basada en evidencia. Estas herramientas combinan fundamentos estadísticos,
                programación científica y visualización interactiva.
              </p>

              <div class="row">
                <div class="col-xs-12 col-sm-6">
                  <div class="card-simple" style="margin-bottom: 2rem;">
                    <h3>Calculadoras estadísticas interactivas</h3>
                    <p>
                      Herramientas para cálculo, simulación y análisis de sensibilidad en problemas
                      de inferencia estadística, tamaño de muestra, potencia e intervalos de confianza.
                    </p>
                    <p>
                      <strong>Aplicación:</strong> docencia, consultoría estadística y planificación de estudios.
                    </p>
                    <p>
                      <strong>Tecnologías:</strong> R, Shiny, Python, JavaScript y GitHub Pages.
                    </p>
                    <p><span class="label label-primary">En desarrollo</span></p>
                  </div>
                </div>

                <div class="col-xs-12 col-sm-6">
                  <div class="card-simple" style="margin-bottom: 2rem;">
                    <h3>Plataformas para docencia estadística</h3>
                    <p>
                      Aplicaciones web para cursos de pregrado y posgrado en estadística,
                      ciencia de datos, modelos lineales, métodos computacionales y aprendizaje automático.
                    </p>
                    <p>
                      <strong>Aplicación:</strong> aprendizaje activo, visualización de conceptos y laboratorios reproducibles.
                    </p>
                    <p>
                      <strong>Tecnologías:</strong> R Markdown, Quarto, Shiny, Python y visualización interactiva.
                    </p>
                    <p><span class="label label-primary">En desarrollo</span></p>
                  </div>
                </div>

                <div class="col-xs-12 col-sm-6">
                  <div class="card-simple" style="margin-bottom: 2rem;">
                    <h3>Herramientas para investigación aplicada</h3>
                    <p>
                      Interfaces para simulación, ajuste de modelos, diagnóstico estadístico,
                      visualización de resultados y automatización de reportes analíticos.
                    </p>
                    <p>
                      <strong>Aplicación:</strong> proyectos de investigación, tesis, artículos y análisis institucional.
                    </p>
                    <p>
                      <strong>Tecnologías:</strong> Python, R, Streamlit, Shiny, APIs y flujos reproducibles.
                    </p>
                    <p><span class="label label-primary">En desarrollo</span></p>
                  </div>
                </div>

                <div class="col-xs-12 col-sm-6">
                  <div class="card-simple" style="margin-bottom: 2rem;">
                    <h3>Automatización de reportes y tableros</h3>
                    <p>
                      Desarrollo de reportes dinámicos, tableros y prototipos web para comunicar resultados
                      estadísticos de forma clara, verificable y orientada a la toma de decisiones.
                    </p>
                    <p>
                      <strong>Aplicación:</strong> analítica académica, investigación aplicada y gestión basada en datos.
                    </p>
                    <p>
                      <strong>Tecnologías:</strong> Quarto, HTML/CSS, JavaScript, R y Python.
                    </p>
                    <p><span class="label label-primary">En desarrollo</span></p>
                  </div>
                </div>
              </div>

              <p>
                Próximamente se incorporarán enlaces públicos a cada plataforma, documentación técnica,
                repositorios de código y ejemplos de uso.
              </p>
            </div>
          </div>
        </div>
      </section>`;

    let $projectNavLink = $('#navbar-main a[href="/#projects"], #navbar-main a[data-target="#projects"]');
    let addedWebToolsNavLink = false;

    if ($projectNavLink.length) {
      $projectNavLink.attr('href', '/#herramientas-web')
        .attr('data-target', '#herramientas-web')
        .find('span').text('Herramientas web');
    } else if (!$('#navbar-main a[href="/#herramientas-web"]').length) {
      let $teachingNavItem = $('#navbar-main a[href="/#teaching"], #navbar-main a[data-target="#teaching"]').closest('li');
      if ($teachingNavItem.length) {
        $teachingNavItem.before('<li class="nav-item"><a href="/#herramientas-web" data-target="#herramientas-web"><span>Herramientas web</span></a></li>');
        addedWebToolsNavLink = true;
      }
    }

    if ($('#projects').length) {
      $('#projects').replaceWith(sectionHtml);
    } else if (!$('#herramientas-web').length && $('#teaching').length) {
      $('#teaching').before(sectionHtml);
    }

    if (addedWebToolsNavLink) {
      $('#navbar-main a[href="/#herramientas-web"]').on('click', function(event) {
        let hash = this.hash;
        if (hash && $(hash).length && ($('#homepage').length > 0)) {
          event.preventDefault();
          let navbarOffset = $('.navbar-header').innerHeight();
          $('html, body').animate({
            scrollTop: $(hash).offset().top - navbarOffset
          }, 800);
        }
      });
    }
  });
})(jQuery);
