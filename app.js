'use strict';
(() => {
  const C = window.MELOIA_CONFIG;
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const safeHttps = value => {
    try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; }
    catch { return ''; }
  };
  const wa = message => 'https://wa.me/' + C.whatsapp.replace(/\D/g, '') + '?text=' + encodeURIComponent(message);
  $('#year').textContent = new Date().getFullYear();

  /* Menú: respuesta inmediata, sin bloquear entradas durante transiciones. */
  const menu = $('.menu-toggle');
  const nav = $('#nav-links');
  function closeMenu() {
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menú');
  }
  menu.addEventListener('click', () => {
    const open = !nav.classList.contains('open');
    nav.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  $$('#nav-links a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* Entrada de secciones, con equivalente estático para movimiento reducido. */
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .05 });
    document.documentElement.classList.add('reveal-ready');
    $$('.reveal').forEach(el => observer.observe(el));
  }

  /* Diálogos nativos: foco contenido, Escape y retorno al control de origen. */
  function showDialog(dialog) {
    dialog.showModal();
    document.body.classList.add('modal-open');
  }
  $$('[data-dialog]').forEach(button => button.addEventListener('click', () => showDialog($('#' + button.dataset.dialog))));
  $$('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      if (!$$('dialog[open]').length) document.body.classList.remove('modal-open');
    });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
  });

  /* Demostración finita de 6 pasos. Se puede pausar y reanudar. */
  const flowNodes = $$('.flow-node');
  const flowControl = $('#flow-control');
  const flowResult = $('#flow-result');
  const flowStatus = $('#flow-status');
  const messages = [
    'Un cliente necesita información sobre tus servicios.',
    'Su mensaje llega a WhatsApp.',
    'La IA responde y entiende qué necesita.',
    'Sus datos quedan organizados en el CRM.',
    'El sistema facilita una reunión y envía recordatorios.',
    'Tu equipo recibe una oportunidad con contexto para avanzar.'
  ];
  let flowIndex = -1;
  let flowTimer = 0;
  let playing = false;
  function renderFlow() {
    flowNodes.forEach((node, index) => {
      node.classList.toggle('active', index === flowIndex);
      node.classList.toggle('done', index < flowIndex);
    });
    if (flowIndex >= 0) flowResult.textContent = messages[flowIndex];
    if (flowStatus) flowStatus.textContent = flowIndex < 0 ? 'Pulsa “Ver el flujo” para verlo en acción.' : flowIndex >= 5 ? 'Flujo completado: una oportunidad lista para avanzar.' : 'Paso ' + (flowIndex + 1) + ' de 6 · El sistema está trabajando.';
  }
  function pauseFlow() {
    clearTimeout(flowTimer);
    playing = false;
    flowControl.setAttribute('aria-pressed', 'false');
    flowControl.textContent = flowIndex === 5 ? 'Repetir flujo' : 'Continuar flujo';
  }
  function advanceFlow() {
    flowIndex++;
    renderFlow();
    if (flowIndex >= 5) { pauseFlow(); return; }
    flowTimer = setTimeout(advanceFlow, 1350);
  }
  flowControl.addEventListener('click', () => {
    if (reduced.matches) {
      flowIndex = flowIndex >= 5 ? 0 : flowIndex + 1;
      renderFlow();
      flowControl.textContent = flowIndex >= 5 ? 'Repetir flujo' : 'Siguiente paso';
      return;
    }
    if (playing) { pauseFlow(); return; }
    if (flowIndex >= 5) flowIndex = -1;
    playing = true;
    flowControl.textContent = 'Pausar flujo';
    flowControl.setAttribute('aria-pressed', 'true');
    advanceFlow();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pauseFlow(); });
  reduced.addEventListener('change', () => { if (playing) pauseFlow(); });

  /* Resorte amortiguado: se retargetea desde posición y velocidad actuales. */
  const tabs = $$('[data-example]');
  const indicator = $('.tab-indicator');
  let activeTab = tabs[0];
  let position = 0, width = 0, velocity = 0, widthVelocity = 0;
  let targetPosition = 0, targetWidth = 0, animationFrame = 0, previousTime = 0;
  function drawIndicator() {
    indicator.style.transform = 'translateX(' + position + 'px)';
    indicator.style.width = width + 'px';
  }
  function springFrame(now) {
    const dt = Math.min((now - previousTime) / 1000 || .016, .032);
    previousTime = now;
    // k=280, damping=2*sqrt(k): critical damping, no decorative bounce.
    const stiffness = 280, damping = 2 * Math.sqrt(stiffness);
    velocity += (stiffness * (targetPosition - position) - damping * velocity) * dt;
    widthVelocity += (stiffness * (targetWidth - width) - damping * widthVelocity) * dt;
    position += velocity * dt;
    width += widthVelocity * dt;
    drawIndicator();
    if (Math.abs(targetPosition - position) < .1 && Math.abs(targetWidth - width) < .1 && Math.abs(velocity) < .1 && Math.abs(widthVelocity) < .1) {
      position = targetPosition; width = targetWidth; velocity = 0; widthVelocity = 0;
      drawIndicator(); animationFrame = 0;
    } else animationFrame = requestAnimationFrame(springFrame);
  }
  function moveIndicator(immediate = false) {
    targetPosition = activeTab.offsetLeft;
    targetWidth = activeTab.offsetWidth;
    if (immediate || reduced.matches) {
      cancelAnimationFrame(animationFrame); animationFrame = 0;
      position = targetPosition; width = targetWidth; velocity = 0; widthVelocity = 0;
      drawIndicator();
    } else if (!animationFrame) {
      previousTime = performance.now(); animationFrame = requestAnimationFrame(springFrame);
    }
  }
  function selectTab(tab, focus = false) {
    activeTab = tab;
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      $('#' + item.getAttribute('aria-controls')).hidden = !selected;
    });
    moveIndicator();
    if (focus) tab.focus();
    track('example_view', { example: tab.dataset.example });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
    });
  });
  moveIndicator(true);
  if ('ResizeObserver' in window) new ResizeObserver(() => moveIndicator(true)).observe($('.tabs'));
  else window.addEventListener('resize', () => moveIndicator(true));
  reduced.addEventListener('change', () => moveIndicator(true));

  /* URLs reales de contacto y calendario opcional. */
  $$('[data-whatsapp]').forEach(link => {
    link.href = wa('Hola MELOIA, quiero descubrir qué puedo automatizar en mi negocio.');
    link.addEventListener('click', () => track('whatsapp_click'));
  });
  $$('[data-booking]').forEach(link => {
    link.href = safeHttps(C.bookingUrl) || wa('Hola MELOIA, quiero coordinar un diagnóstico gratuito. ¿Qué horarios tienen disponibles?');
    link.addEventListener('click', () => track('booking_click', { channel: C.bookingUrl ? 'calendar' : 'whatsapp' }));
  });
  if (safeHttps(C.bookingUrl)) $('#booking-note').textContent = 'Elige un horario disponible en nuestro calendario.';
  $$('[data-social]').forEach(button => button.addEventListener('click', () => {
    const url = safeHttps(button.dataset.social === 'linkedin' ? C.linkedinUrl : C.instagramUrl);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else showDialog($('#social-dialog'));
  }));

  /* Analítica preparada. Proveedores externos solo con consentimiento. */
  let analyticsConsent = false;
  let analyticsStarted = false;
  try { analyticsConsent = localStorage.getItem('meloia_analytics') === 'yes'; } catch {}
  function startAnalytics() {
    if (!analyticsConsent || analyticsStarted) return;
    analyticsStarted = true;
    if (/^G-[A-Z0-9]+$/.test(C.gaId)) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      window.gtag('js', new Date());
      window.gtag('config', C.gaId);
      const script = document.createElement('script');
      script.async = true; script.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.gaId;
      document.head.append(script);
    }
    if (/^\d+$/.test(C.metaPixelId)) {
      const fbq = function () { if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments); else fbq.queue.push(arguments); };
      fbq.queue = []; fbq.loaded = true; fbq.version = '2.0'; fbq.push = fbq;
      window.fbq = window._fbq = fbq;
      const script = document.createElement('script');
      script.async = true; script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.append(script);
      fbq('consent', 'grant'); fbq('init', C.metaPixelId); fbq('track', 'PageView');
    }
  }
  function track(name, properties = {}) {
    if (!analyticsConsent) return;
    if (typeof window.gtag === 'function') window.gtag('event', name, properties);
    if (typeof window.fbq === 'function') window.fbq('trackCustom', name, properties);
    document.dispatchEvent(new CustomEvent('meloia:analytics', { detail: { event: name, ...properties } }));
  }
  $$('[data-consent]').forEach(button => button.addEventListener('click', () => {
    analyticsConsent = button.dataset.consent === 'yes';
    try { localStorage.setItem('meloia_analytics', analyticsConsent ? 'yes' : 'no'); } catch {}
    if (analyticsConsent) {
      if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: 'granted' });
      if (typeof window.fbq === 'function') window.fbq('consent', 'grant');
      startAnalytics();
    } else {
      if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: 'denied' });
      if (typeof window.fbq === 'function') window.fbq('consent', 'revoke');
    }
    $('#analytics-dialog').close();
  }));
  startAnalytics();
  $$('[data-track]').forEach(link => link.addEventListener('click', () => track('cta_click', { placement: link.dataset.track })));

  /* Auditoría: validación inline, envío manual honesto o backend configurable. */
  const form = $('#audit-form');
  const status = $('#form-status');
  const submit = $('#submit-button');
  const endpoint = safeHttps(C.formEndpoint);
  let selectedPlan = '', requestText = '', requestId = '', submitting = false;
  if (endpoint) {
    $('#delivery-note').textContent = 'Enviaremos tu solicitud directamente a MELOIA.';
    // El responsable debe actualizar la política al conectar un backend real.
    const privacy = $('#privacy-dialog');
    privacy.querySelectorAll('p')[1].textContent = 'Al enviar el formulario, tus datos se transmiten a MELOIA para atender tu solicitud. Puedes solicitar información sobre su tratamiento en nuestro correo de contacto.';
  }
  $$('[data-plan]').forEach(link => link.addEventListener('click', () => {
    selectedPlan = link.dataset.plan;
    track('plan_select', { plan: selectedPlan });
  }));
  function validateField(input) {
    const value = input.value.trim();
    let message = '';
    if (!value) message = 'Completa este campo.';
    else if (input.id === 'phone' && !/^\+?\d{8,15}$/.test(value.replace(/[\s().-]/g, ''))) message = 'Incluye un número válido con código de país.';
    else if (input.id === 'email' && input.validity.typeMismatch) message = 'Revisa el formato de tu correo.';
    else if (input.id === 'process' && value.length < 10) message = 'Cuéntanos un poco más: al menos 10 caracteres.';
    input.setCustomValidity(message);
    input.setAttribute('aria-invalid', String(!!message));
    const error = $('#' + input.id + '-error');
    if (error) { error.textContent = message; input.setAttribute('aria-describedby', error.id); }
    return !message;
  }
  const inputs = $$('.fields input, .fields textarea');
  inputs.forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      requestId = '';
      if (input.getAttribute('aria-invalid') === 'true') validateField(input);
    });
  });
  function prepareRequest(values) {
    requestText = 'SOLICITUD DE AUDITORÍA GRATUITA — MELOIA\n\n' +
      'Nombre: ' + values.name + '\nEmpresa: ' + values.company + '\n' +
      'WhatsApp: ' + values.phone + '\nEmail: ' + values.email + '\n' +
      (selectedPlan ? 'Plan de interés: ' + selectedPlan + '\n' : '') +
      '\nProceso que quiero automatizar:\n' + values.process + '\n\n' +
      'Autorizo a MELOIA a contactarme para atender esta solicitud.';
    const subject = 'Auditoría gratuita — ' + values.company;
    $('#request-preview').textContent = requestText;
    $('#request-mail').href = 'mailto:' + C.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(requestText);
    $('#request-gmail').href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(C.email) + '&su=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(requestText);
    $('#request-wa').href = wa(requestText);
    $('#copy-status').textContent = '';
    showDialog($('#request-dialog'));
    status.textContent = 'Solicitud preparada. Elige un canal y confirma el envío allí.';
    track('audit_prepared', { plan: selectedPlan || 'unspecified' });
  }
  $('#copy-request').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(requestText); $('#copy-status').textContent = 'Solicitud copiada.'; }
    catch { $('#copy-status').textContent = 'No pudimos copiarla. Selecciona el texto de la solicitud y cópialo manualmente.'; }
  });
  ['request-mail', 'request-gmail', 'request-wa'].forEach(id => $('#' + id).addEventListener('click', () => {
    track('audit_channel_open', { channel: id });
    $('#copy-status').textContent = 'Completa el envío en el servicio que abriste. Esta página no puede confirmar su recepción.';
  }));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    const valid = inputs.map(validateField).every(Boolean);
    if (!valid || !form.reportValidity()) return;
    const values = new FormData(form);
    if (values.get('website')) return;
    const payload = {
      name: values.get('name').trim(), company: values.get('company').trim(),
      phone: values.get('phone').trim(), email: values.get('email').trim(),
      process: values.get('process').trim(), consent: true,
      plan: selectedPlan || null, source: 'meloia_website'
    };
    if (!endpoint) { prepareRequest(payload); return; }
    if (!requestId) requestId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
    payload.requestId = requestId;
    payload.submittedAt = new Date().toISOString();
    submitting = true; submit.disabled = true; submit.textContent = 'Enviando solicitud…';
    status.textContent = 'Estamos enviando tu solicitud.';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal, credentials: 'omit' });
      if (!response.ok) throw new Error('server');
      const result = await response.json();
      if (result.ok !== true) throw new Error('unconfirmed');
      status.textContent = 'Solicitud recibida. Te contactaremos para conocer mejor tu negocio.';
      track('generate_lead', { form: 'audit', plan: selectedPlan || 'unspecified' });
      form.reset(); selectedPlan = ''; requestId = '';
    } catch {
      status.textContent = 'No pudimos confirmar la recepción. Conservamos tus datos para que puedas reintentar.';
    } finally {
      clearTimeout(timeout); submitting = false; submit.disabled = false;
      submit.textContent = 'Solicitar auditoría gratuita';
    }
  });
  /* Microinteracciones adicionales: parallax sutil y métricas al entrar en pantalla. */
  const visual = $('[data-parallax]');
  if (visual && !reduced.matches) {
    let ticking = false;
    const parallax = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = visual.getBoundingClientRect();
          const offset = Math.max(-10, Math.min(10, (window.innerHeight / 2 - (rect.top + rect.height / 2)) * .025));
          visual.style.setProperty('--parallax-y', offset + 'px'); ticking = false;
        }); ticking = true;
      }
    };
    window.addEventListener('scroll', parallax, { passive: true }); parallax();
  }
  const counters = $$('.metric strong[data-count]');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting || entry.target.dataset.done) return;
      entry.target.dataset.done = 'true';
      const target = Number(entry.target.dataset.count), suffix = entry.target.dataset.suffix || '';
      let start = 0, started = performance.now();
      const tick = now => { const progress = Math.min(1, (now - started) / 750); start = Math.round(target * (1 - Math.pow(1 - progress, 3))); entry.target.textContent = start + suffix; if (progress < 1) requestAnimationFrame(tick); else entry.target.classList.add('counted'); };
      requestAnimationFrame(tick);
    }), { threshold: .65 });
    counters.forEach(counter => counterObserver.observe(counter));
  }
  const flowStage = $('.flow-stage');
  if (flowStage && flowControl) flowControl.addEventListener('click', () => flowStage.classList.toggle('is-playing', flowControl.getAttribute('aria-pressed') === 'true'));

  /* Calendly, idioma y precios regionales. */
  const calendlyUrl = 'https://calendly.com/meloia0412/30min';
  $$('[data-booking]').forEach(link => { link.href = calendlyUrl; link.target = '_blank'; });
  const translations = {
    es: { navSolutions:'Soluciones',navProcess:'Cómo funciona',navPlans:'Planes',navFaq:'Preguntas',navCta:'Auditoría gratuita',integrationsLead:'Tus herramientas de siempre. Trabajando mejor juntas.',calculatorEyebrow:'Calcula una oportunidad',calculatorTitle:'Descubre cuánto trabajo podrías recuperar.',calculatorLead:'Primero cuéntanos quién eres. Después te mostraremos una estimación orientativa y las automatizaciones que podrían tener más sentido.',calculatorButton:'Ver mi estimación',calculatorCta:'Solicitar auditoría',from:'Desde'},
    en: { navSolutions:'Solutions',navProcess:'How it works',navPlans:'Plans',navFaq:'FAQ',navCta:'Free audit',integrationsLead:'The tools you already use. Working better together.',calculatorEyebrow:'Estimate an opportunity',calculatorTitle:'Discover how much work you could recover.',calculatorLead:'Tell us who you are first. Then we will show an indicative estimate and the automations that may make the most sense.',calculatorButton:'See my estimate',calculatorCta:'Request an audit',from:'From'}
  };
  const fullEnglish = {
    'Automatización inteligente. Negocios más humanos.':'Intelligent automation. More human businesses.',
    'Trabaja menos.':'Work less.', 'Vende más. ':'Sell more. ', 'Con IA.':'With AI.',
    'Automatizamos tu negocio con sistemas que responden clientes, hacen seguimiento y eliminan tareas repetitivas. Las 24 horas.':'We automate your business with systems that answer customers, follow up and remove repetitive work. Around the clock.',
    'Descubre qué puedes automatizar':'Discover what you can automate','Hablar por WhatsApp':'Talk on WhatsApp','Analizamos tu negocio y encontramos oportunidades de automatización sin compromiso.':'We analyze your business and find automation opportunities, with no obligation.','Sin conocimientos técnicos':'No technical knowledge needed','Con tus herramientas':'With your tools','A tu medida':'Built for you',
    'Un mensaje. Todo conectado.':'One message. Everything connected.','Así podría trabajar tu negocio.':'This is how your business could work.','Ver el flujo':'See the workflow','Cliente':'Customer','Quiere información':'Wants information','WhatsApp':'WhatsApp','Recibe el mensaje':'Receives the message','Asistente IA':'AI assistant','Responde y califica':'Answers and qualifies','CRM':'CRM','Organiza los datos':'Organizes the data','Seguimiento':'Follow-up','Agenda y recuerda':'Schedules and reminds','Venta':'Sale','Una oportunidad más':'One more opportunity','El sistema se encarga del proceso.':'The system handles the process.','Tu equipo se enfoca en el cliente.':'Your team focuses on the customer.','Ejemplo ilustrativo. Cada flujo se adapta a tu negocio; una venta depende de tu proceso comercial.':'Illustrative example. Every workflow adapts to your business; a sale depends on your sales process.','Tus herramientas de siempre. Trabajando mejor juntas.':'The tools you already use. Working better together.',
    'El tiempo también es una oportunidad':'Time is also an opportunity','Tu equipo tiene cosas':'Your team has more important','más importantes que repetir.':'things to do than repeat tasks.','Probablemente pierdes horas en tareas que podrían automatizarse.':'You are probably losing hours on tasks that could be automated.','Responder las mismas preguntas todos los días.':'Answering the same questions every day.','Hacer seguimiento manual a cada cliente.':'Following up with every customer manually.','Copiar información entre herramientas.':'Copying information between tools.','Perder prospectos por responder tarde.':'Losing prospects by responding too late.','Coordinar reuniones mensaje por mensaje.':'Coordinating meetings message by message.','Crear los mismos reportes cada semana.':'Creating the same reports every week.','Nosotros convertimos estos procesos en sistemas automáticos.':'We turn these processes into automated systems.',
    'Soluciones que se sienten simples':'Solutions that feel simple','Más atención. Más orden.':'More attention. More order.','Menos trabajo manual.':'Less manual work.','La tecnología trabaja detrás. Tu negocio nota el beneficio.':'Technology works behind the scenes. Your business feels the benefit.','Automatización de WhatsApp':'WhatsApp automation','Automatización de ventas':'Sales automation','Agentes de IA':'AI agents','Automatización de procesos':'Process automation','Responde a tiempo y acompaña al cliente hasta el siguiente paso.':'Respond on time and guide customers to the next step.','Organiza tus prospectos y mantén el proceso comercial en movimiento.':'Organize prospects and keep your sales process moving.','Asistentes inteligentes que utilizan la información de tu empresa.':'Intelligent assistants that use your business information.','Conecta tu operación y deja atrás el copiar y pegar.':'Connect your operation and leave copy and paste behind.',
    'De tu día a día a una mejor forma de trabajar':'From daily work to a better way of working','Lo hacemos contigo.':'We do it with you.','Nos encargamos por ti.':'We take care of it for you.','Un proceso claro, desde la primera conversación hasta la puesta en marcha.':'A clear process, from the first conversation to launch.','Analizamos tu negocio.':'We analyze your business.','Encontramos oportunidades.':'We find opportunities.','Construimos e integramos.':'We build and integrate.','Tu sistema trabaja 24/7.':'Your system works 24/7.',
    'Imagina esto en tu empresa':'Imagine this in your business','Un pequeño cambio.':'A small change.','Un día mucho más simple.':'A much simpler day.','Explora tres ejemplos de automatizaciones que podemos construir.':'Explore three examples of automations we can build.','Atención al cliente':'Customer support','Nuevos prospectos':'New prospects','Facturas y reportes':'Invoices and reports','Ejemplo ilustrativo':'Illustrative example','Tu equipo dedica su tiempo a conversar, asesorar y cerrar oportunidades.':'Your team spends its time talking, advising and closing opportunities.',
    'El impacto que buscamos':'The impact we aim for','Más tiempo para tu negocio.':'More time for your business.','Y para ti.':'And for you.','de ahorro semanal como objetivo posible, según tus procesos.':'of possible weekly savings, depending on your processes.','atención automática para las consultas y tareas que definamos.':'of automated support for the questions and tasks we define.','trabajo manual y prospectos sin seguimiento.':'manual work and prospects without follow-up.','Seguimiento automático':'Automated follow-up','Procesos más rápidos':'Faster processes','Más capacidad para crecer':'More capacity to grow.',
    'Empieza por lo que necesitas':'Start with what you need','Una automatización.':'One automation.','O todo un sistema.':'Or a complete system.','Inversión orientativa en USD. Definimos la propuesta después de conocer tu negocio.':'Indicative investment in USD. We define the proposal after learning about your business.','Implementación inicial':'Initial implementation','Proyecto personalizado':'Custom project','MÁS POPULAR · PLAN DESTACADO':'MOST POPULAR · FEATURED PLAN','Quiero automatizar mi negocio':'I want to automate my business','Quiero impulsar mi negocio':'I want to grow my business','Diseñar mi sistema de IA':'Design my AI system','Mantenimiento y optimización, según tu sistema.':'Maintenance and optimization, according to your system.',
    'Tu primer paso es gratuito':'Your first step is free','Descubre qué podrías ':'Discover what you could ','automatizar.':'automate.','Cuéntanos cómo funciona tu empresa. Analizaremos gratuitamente qué tareas podrían automatizarse con inteligencia artificial.':'Tell us how your company works. We will identify which tasks could be automated with AI, free of charge.','Sin compromiso. Puedes empezar con una sola automatización.':'No obligation. You can start with a single automation.','Nombre':'Name','Empresa':'Company','WhatsApp':'WhatsApp','Email':'Email','Proceso que quiero automatizar':'Process I want to automate','Solicitar auditoría gratuita':'Request a free audit','Autorizo que MELOIA me contacte para atender esta solicitud.':'I authorize MELOIA to contact me about this request.','Prepararemos un mensaje para que lo envíes desde tu correo o WhatsApp.':'We will prepare a message for you to send by email or WhatsApp.','Cómo se calcula':'How the investment is calculated','El valor se define con transparencia.':'The investment is defined transparently.','La propuesta final considera complejidad, integraciones, herramientas externas, volumen de datos, tiempo de implementación y soporte. Primero entendemos el proceso; después acordamos alcance, inversión y condiciones antes de comenzar.':'The final proposal considers complexity, integrations, third-party tools, data volume, implementation time and support. We first understand the process; then we agree on scope, investment and terms before starting.','Ver qué incluye el valor':'See what determines the investment','Complejidad y número de procesos.':'Complexity and number of processes.','Integraciones con tus herramientas.':'Integrations with your tools.','Costos de terceros.':'Third-party costs.','Volumen de datos y usuarios.':'Data and user volume.','Implementación, pruebas y documentación.':'Implementation, testing and documentation.','Mantenimiento y soporte posterior.':'Maintenance and ongoing support.','El precio final depende de la complejidad y las herramientas necesarias. Licencias, consumo de IA, mensajería e impuestos se detallan en la propuesta. “Más popular” identifica el plan destacado, no una estadística de ventas.':'The final price depends on complexity and the tools required. Licenses, AI usage, messaging and taxes are detailed in the proposal. “Most popular” identifies the featured plan, not a sales statistic.',
    'Adaptado a tu forma de trabajar':'Adapted to the way you work','Cada negocio es diferente.':'Every business is different.','Tu sistema también.':'So is your system.','Construimos alrededor de tu operación, tus clientes y tus herramientas.':'We build around your operation, customers and tools.','Las respuestas antes del primer paso.':'Answers before the first step.','No necesitas entender de IA para empezar. Te ayudamos a encontrar una solución útil.':'You do not need to understand AI to get started. We help you find a useful solution.','¿Qué procesos se pueden automatizar?':'What processes can be automated?','Consultas frecuentes, seguimiento de prospectos, recordatorios, movimiento de datos y reportes. En el diagnóstico revisamos qué es viable y qué debe mantener supervisión humana.':'Frequently asked questions, prospect follow-up, reminders, data movement and reports. During the diagnostic, we review what is viable and what should keep human oversight.','¿Necesito cambiar las herramientas que utilizo?':'Do I need to change the tools I use?','En muchos casos conectamos las que ya tienes. Primero revisamos si permiten integraciones y te explicamos las opciones antes de recomendar un cambio.':'In many cases, we connect the tools you already have. We first check whether they support integrations and explain the options before recommending a change.','¿Cuánto tarda una automatización?':'How long does an automation take?','Depende del alcance, las integraciones y la información disponible. Después del diagnóstico te entregamos un cronograma con construcción, pruebas y puesta en marcha.':'It depends on scope, integrations and the information available. After the diagnostic, we provide a timeline for building, testing and launch.','¿Cuánto cuesta?':'How much does it cost?','Los proyectos Starter tienen una referencia desde US$300–600. La propuesta define el valor de implementación, las herramientas y el mantenimiento según lo que necesites.':'Starter projects have an indicative range from US$300–600. The proposal defines implementation, tools and maintenance according to your needs.','¿La IA puede responder a mis clientes?':'Can AI respond to my customers?','Sí, con información y reglas de tu empresa. Definimos qué puede responder y cuándo transferir a una persona. La IA puede cometer errores, por eso incluimos pruebas y límites acordes al uso.':'Yes, using your company information and rules. We define what it can answer and when to hand off to a person. AI can make mistakes, so we include testing and appropriate limits.','¿Puedo empezar con una sola automatización?':'Can I start with a single automation?','Sí. Podemos resolver primero una tarea concreta, medir el beneficio y ampliar el sistema cuando tenga sentido para tu negocio.':'Yes. We can first solve one specific task, measure the benefit and expand the system when it makes sense for your business.','¿Ofrecen mantenimiento?':'Do you offer maintenance?','Sí. Podemos revisar el funcionamiento, resolver incidencias y optimizar tus procesos. El alcance y la mensualidad se acuerdan en la propuesta.':'Yes. We can review performance, resolve issues and optimize your processes. Scope and monthly fees are agreed in the proposal.','Tu negocio no necesita más tareas.':'Your business does not need more tasks.','Necesita mejores sistemas.':'It needs better systems.','Descubre qué podemos automatizar en tu empresa.':'Discover what we can automate in your business.','Agendar diagnóstico gratuito':'Book a free diagnostic','Automatización inteligente.':'Intelligent automation.','Más tiempo para lo que importa.':'More time for what matters.','Servicios':'Services','Empresa':'Company','Contacto':'Contact','Política de privacidad':'Privacy policy','Preguntas':'Questions','Conectamos procesos. Liberamos posibilidades.':'We connect processes. We unlock possibilities.'
  };
  const originalText = new WeakMap();
  function translateAllText(lang) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = []; let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach(textNode => {
      if (!originalText.has(textNode)) originalText.set(textNode, textNode.nodeValue);
      const original = originalText.get(textNode);
      if (lang === 'en') {
        let value = original; Object.keys(fullEnglish).forEach(es => { if (value.includes(es)) value = value.split(es).join(fullEnglish[es]); }); textNode.nodeValue = value;
      } else textNode.nodeValue = original;
    });
  }
  Object.assign(fullEnglish, {'Todo claro desde el inicio':'Everything clear from the start','Las respuestas':'The answers','antes del primer paso.':'before the first step.','Las respuestas antes del primer paso.':'Answers before the first step.'});
  const priceSets = { es:['COP 1.260.000–2.520.000','COP 3.360.000–6.300.000','Desde COP 8.400.000+'], en:['US$300–600','US$800–1.500','From US$2,000+'] };
  const maintenanceSets = { es:'Desde COP 420.000–2.100.000/mes', en:'From US$100–500/month' };
  function applyLanguage(lang) {
    document.documentElement.lang = lang;
    translateAllText(lang);
    $$('[data-i18n]').forEach(el => { const value = translations[lang][el.dataset.i18n]; if (value) el.textContent = value; });
    $$('.plan .price').forEach((el, i) => { el.innerHTML = '<small>' + (lang === 'es' ? 'Desde' : 'From') + '</small><br><span class="price-value">' + priceSets[lang][i] + '</span>'; });
    const maintenance = $('.maintenance-price'); if (maintenance) maintenance.textContent = maintenanceSets[lang];
    const active = $('.lang-active'); if (active) active.textContent = lang.toUpperCase();
    try { localStorage.setItem('meloia_lang', lang); } catch {}
  }
  const languageToggle = $('.language-toggle');
  if (languageToggle) { const queryLang = new URLSearchParams(location.search).get('lang'); const saved = (() => { try { return localStorage.getItem('meloia_lang'); } catch { return null; } })(); applyLanguage(queryLang === 'en' || saved === 'en' ? 'en' : 'es'); languageToggle.addEventListener('click', () => applyLanguage(document.documentElement.lang === 'es' ? 'en' : 'es')); }

  const calculatorForm = $('#calculator-form'), calculatorResult = $('#calculator-result');
  if (calculatorForm && calculatorResult) calculatorForm.addEventListener('submit', event => {
    event.preventDefault(); const data = new FormData(calculatorForm); const hours = Math.max(1, Number(data.get('hours')) || 1); const recovered = Math.round(hours * .65); const title = $('#calculator-result-title'), copy = $('#calculator-result-copy');
    title.textContent = (document.documentElement.lang === 'en' ? 'You could recover around ' : 'Podrías recuperar aproximadamente ') + recovered + (document.documentElement.lang === 'en' ? ' hours each week.' : ' horas cada semana.');
    copy.textContent = document.documentElement.lang === 'en' ? 'This is an indicative estimate, not a promise. In the audit we identify the processes with the best opportunity for your business.' : 'Es una estimación orientativa, no una promesa. En la auditoría identificamos los procesos con mejor oportunidad para tu negocio.';
    calculatorResult.hidden = false; calculatorResult.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'nearest' }); track('calculator_complete', { industry: data.get('industry') });
  });
  /* Pulido de navegación y profundidad en escritorio. */
  const header = $('.header');
  if (header) { const syncHeader = () => header.classList.toggle('scrolled', window.scrollY > 24); window.addEventListener('scroll', syncHeader, { passive: true }); syncHeader(); }
  if (!reduced.matches && window.matchMedia('(pointer:fine)').matches) {
    const spotlight = document.createElement('div'); spotlight.className = 'cursor-spotlight'; document.body.append(spotlight);
    window.addEventListener('pointermove', event => { spotlight.style.setProperty('--x', event.clientX + 'px'); spotlight.style.setProperty('--y', event.clientY + 'px'); }, { passive: true });
  }
})();
