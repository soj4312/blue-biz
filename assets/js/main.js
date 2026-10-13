/* =====================================================================
   BlueBiz 홈페이지 리뉴얼 - 공통 스크립트
   모든 페이지(index/about/solutions/industries/cases/resources/contact)가
   이 파일 하나를 공유합니다. 페이지에 없는 요소는 조회 시 자동으로 건너뜁니다.
===================================================================== */
(function(){
  "use strict";

  /* ---------- 사이드바 확장/축소 (localStorage에 상태 저장) ---------- */
  var sidebar = document.getElementById('appSidebar');
  var sidebarToggle = document.getElementById('sidebarToggle');
  var SIDEBAR_KEY = 'bluebiz-sidebar-expanded';

  function applySidebarState(expanded){
    if(!sidebar) return;
    sidebar.classList.toggle('is-expanded', expanded);
    document.documentElement.style.setProperty('--sidebar-w', expanded ? 'var(--sidebar-w-expanded)' : 'var(--sidebar-w-collapsed)');
    if(sidebarToggle){ sidebarToggle.setAttribute('aria-pressed', expanded ? 'true' : 'false'); }
  }
  if(sidebar && sidebarToggle){
    // 기본값은 펼쳐진 상태이며, 사용자가 명시적으로 접은 경우에만 축소 상태를 기억합니다.
    var savedExpanded = true;
    try{
      var stored = localStorage.getItem(SIDEBAR_KEY);
      if(stored !== null){ savedExpanded = stored === 'true'; }
    }catch(e){ /* noop */ }
    applySidebarState(savedExpanded);
    sidebarToggle.addEventListener('click', function(){
      var next = !sidebar.classList.contains('is-expanded');
      applySidebarState(next);
      try{ localStorage.setItem(SIDEBAR_KEY, String(next)); }catch(e){ /* noop */ }
    });
  }

  /* ---------- 모바일 드로어 메뉴 ---------- */
  var drawerToggleBtn = document.getElementById('mobileDrawerToggle');
  var drawerCloseBtn = document.getElementById('mobileDrawerClose');
  var mobileDrawer = document.getElementById('mobileDrawer');

  function openDrawer(){
    mobileDrawer.classList.add('open');
    drawerToggleBtn.setAttribute('aria-expanded','true');
    document.body.classList.add('no-scroll');
    drawerCloseBtn.focus();
  }
  function closeDrawer(){
    mobileDrawer.classList.remove('open');
    drawerToggleBtn.setAttribute('aria-expanded','false');
    document.body.classList.remove('no-scroll');
    drawerToggleBtn.focus();
  }
  if(drawerToggleBtn && mobileDrawer && drawerCloseBtn){
    drawerToggleBtn.addEventListener('click', openDrawer);
    drawerCloseBtn.addEventListener('click', closeDrawer);
    mobileDrawer.querySelectorAll('nav a').forEach(function(a){
      a.addEventListener('click', closeDrawer);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && mobileDrawer.classList.contains('open')){ closeDrawer(); }
    });
  }

  /* ---------- Active 메뉴 하이라이트 (페이지 단위 라우팅) ---------- */
  var currentPage = document.body.getAttribute('data-page');
  function setActiveNav(navKey){
    document.querySelectorAll('[data-nav]').forEach(function(link){
      var match = link.getAttribute('data-nav') === navKey;
      link.classList.toggle('active', match);
      if(match){ link.setAttribute('aria-current', 'page'); }
      else{ link.removeAttribute('aria-current'); }
    });
  }
  if(currentPage){ setActiveNav(currentPage); }

  /* ---------- solutions.html 내 스크롤 위치에 따른 사이드바 강조 전환 ---------- */
  var scrollSpySections = [
    { id: 'solutions-grid', nav: 'solutions' },
    { id: 'flow', nav: 'flow' },
    { id: 'proof', nav: 'proof' }
  ].map(function(s){ return { el: document.getElementById(s.id), nav: s.nav }; }).filter(function(s){ return s.el; });

  if(scrollSpySections.length && 'IntersectionObserver' in window){
    var spyObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          var match = scrollSpySections.find(function(s){ return s.el === entry.target; });
          if(match){ setActiveNav(match.nav); }
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    scrollSpySections.forEach(function(s){ spyObserver.observe(s.el); });
  }

  /* ---------- 현장 문제 칩 ↔ 솔루션 카드 강조 연동 (index.html) ---------- */
  var problemChips = document.querySelectorAll('.problem-chip');
  var solutionsPreviewSection = document.querySelector('#solutions-preview .bento') || document.getElementById('solutions-preview');
  if(problemChips.length){
    problemChips.forEach(function(chip){
      chip.addEventListener('click', function(){
        var isActive = chip.classList.contains('is-active');
        problemChips.forEach(function(c){ c.classList.remove('is-active'); });
        document.querySelectorAll('.b-card, .sol-mini-card').forEach(function(c){ c.classList.remove('is-highlighted'); });
        if(isActive) return;
        chip.classList.add('is-active');
        var targets = (chip.getAttribute('data-target') || '').split(',').map(function(t){ return t.trim(); }).filter(Boolean);
        targets.forEach(function(id){
          var card = document.getElementById(id);
          if(card){ card.classList.add('is-highlighted'); }
        });
        if(solutionsPreviewSection){
          var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          solutionsPreviewSection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        }
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealEls.length){
    var revealObserver = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {threshold:0.15});
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---------- Count-up (trust indicators, once per page) ---------- */
  var countEls = document.querySelectorAll('.count-up');
  var counted = false;
  function runCountUp(){
    if(counted) return;
    counted = true;
    countEls.forEach(function(el){
      var target = parseInt(el.getAttribute('data-target'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(reduceMotion){ el.textContent = target + suffix; return; }
      var duration = 1100;
      var startTime = null;
      function step(ts){
        if(!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var val = Math.floor(progress * target);
        el.textContent = val + suffix;
        if(progress < 1){ requestAnimationFrame(step); }
        else{ el.textContent = target + suffix; }
      }
      requestAnimationFrame(step);
    });
  }
  var trustGrid = document.getElementById('trustGrid');
  if(trustGrid && countEls.length){
    if('IntersectionObserver' in window){
      var trustObserver = new IntersectionObserver(function(entries, obs){
        entries.forEach(function(entry){
          if(entry.isIntersecting){ runCountUp(); obs.disconnect(); }
        });
      }, {threshold:0.4});
      trustObserver.observe(trustGrid);
    } else {
      runCountUp();
    }
  }

  /* ---------- Hero 대시보드: 실제 화면 여러 장이 슬라이드처럼 넘어가고, 좌우 버튼으로도 넘길 수 있습니다 (index.html) ---------- */
  var heroTrack = document.getElementById('heroTrack');
  var heroFrame = document.getElementById('heroDashFrame');
  if(heroTrack && heroFrame){
    var heroCaption = document.getElementById('heroDashCaption');
    var heroDotsWrap = document.getElementById('heroDots');
    var heroPrev = document.getElementById('heroPrev');
    var heroNext = document.getElementById('heroNext');
    var HERO_ADVANCE_MS = 5200;
    var HERO_SLIDES = [
      { src: 'assets/img/screen-overview.png', title: '통합 현황 · 생산·수주 한눈에' },
      { src: 'assets/img/screen-production.png', title: '생산관리 · 계획 대비 실적' },
      { src: 'assets/img/screen-equipment.png', title: '설비 모니터링 · 온도 이력' },
      { src: 'assets/img/screen-fhms.png', title: '품질·HACCP · CCP 온도 관리' },
      { src: 'assets/img/screen-wms.png', title: '재고·물류 · 원료 탱크 재고' }
    ];
    var heroIdx = 0;
    var heroTimer = null;

    HERO_SLIDES.forEach(function(item, i){
      var slide = document.createElement('div');
      slide.className = 'hero-slide';
      var img = document.createElement('img');
      img.alt = item.title;
      img.loading = i === 0 ? 'eager' : 'lazy';
      img.decoding = 'async';
      if(i === 0){
        img.onload = function(){ heroFrame.classList.add('has-real-image'); };
        img.onerror = function(){ heroFrame.classList.remove('has-real-image'); };
      }
      img.src = item.src;
      slide.appendChild(img);
      heroTrack.appendChild(slide);

      if(heroDotsWrap){
        var dot = document.createElement('i');
        if(i === 0){ dot.className = 'active'; }
        dot.addEventListener('click', function(){ showHeroSlide(i); restartHeroTimer(); });
        heroDotsWrap.appendChild(dot);
      }
    });

    function showHeroSlide(idx){
      heroIdx = ((idx % HERO_SLIDES.length) + HERO_SLIDES.length) % HERO_SLIDES.length;
      heroTrack.style.transform = 'translateX(-' + (heroIdx * 100) + '%)';
      if(heroCaption){ heroCaption.textContent = HERO_SLIDES[heroIdx].title; }
      if(heroDotsWrap){
        Array.prototype.forEach.call(heroDotsWrap.children, function(d, i){
          d.classList.toggle('active', i === heroIdx);
        });
      }
    }
    function restartHeroTimer(){
      if(heroTimer){ clearInterval(heroTimer); }
      heroTimer = setInterval(function(){ showHeroSlide(heroIdx + 1); }, HERO_ADVANCE_MS);
    }

    if(heroPrev){ heroPrev.addEventListener('click', function(){ showHeroSlide(heroIdx - 1); restartHeroTimer(); }); }
    if(heroNext){ heroNext.addEventListener('click', function(){ showHeroSlide(heroIdx + 1); restartHeroTimer(); }); }

    showHeroSlide(0);
    restartHeroTimer();
    heroFrame.addEventListener('mouseenter', function(){ if(heroTimer){ clearInterval(heroTimer); } });
    heroFrame.addEventListener('mouseleave', restartHeroTimer);
  }

  /* ---------- Proof tabs (solutions.html): 탭마다 실제 화면 여러 장이 자동으로 넘어갑니다 ---------- */
  var proofTabs = document.getElementById('proofTabs');
  if(proofTabs){
    var tabs = Array.prototype.slice.call(proofTabs.querySelectorAll('[role="tab"]'));
    var proofShot = document.getElementById('proofShot');
    var proofDots = document.getElementById('proofDots');
    var proofCount = document.getElementById('proofCount');
    var proofCaptionTitle = document.getElementById('proofCaptionTitle');
    var proofCaptionDesc = document.getElementById('proofCaptionDesc');
    var PROOF_ADVANCE_MS = 4200;

    // 카테고리(탭)별 실제 화면 여러 장 + 각 화면에 대한 설명
    var PROOF_SETS = {
      'panel-0': [
        { src: '../assets/img/screen-overview-1.png', title: '불량율 추이', desc: '월간·주간·일일 불량율을 목표 관리선과 함께 한눈에 확인합니다.' },
        { src: '../assets/img/screen-overview-2.png', title: '생산·수주 현황판', desc: '생산금액, 목표 대비 달성률, 실시간 수주 현황을 함께 확인합니다.' }
      ],
      'panel-1': [
        { src: '../assets/img/screen-production-1.png', title: '생산계획 캘린더', desc: '일자별 생산계획과 지시 수량을 캘린더로 확인합니다.' },
        { src: '../assets/img/screen-production-2.png', title: '계획 대비 실적 연동', desc: '생산계획·실적과 불량·투입자재 등록까지 한 화면에서 연결됩니다.' },
        { src: '../assets/img/screen-production-3.png', title: '현장 생산시작·종료', desc: '현장 작업자가 버튼 하나로 생산 시작·종료와 실적을 입력합니다.' }
      ],
      'panel-2': [
        { src: '../assets/img/screen-equipment-1.png', title: '설비 온도 모니터링', desc: '설비별 실시간 온도와 정상범위, 이력을 그래프와 로그로 확인합니다.' },
        { src: '../assets/img/screen-equipment-2.png', title: '설비별 생산수량 로그', desc: '포장기 등 개별 설비의 가동 여부와 10분 단위 생산수량을 기록합니다.' },
        { src: '../assets/img/screen-equipment-3.png', title: '전력사용 모니터링', desc: '설비 전력 사용량을 분 단위로 수집해 추이를 확인합니다.' }
      ],
      'panel-3': [
        { src: '../assets/img/screen-fhms-1.png', title: '출하검사 현황', desc: '품목별 검사수량·합격수량·불량수량을 검사일 기준으로 관리합니다.' },
        { src: '../assets/img/screen-fhms-2.png', title: '출하검사 상세', desc: '케이블 규격·외피탈피 등 검사 항목별 결과를 세부 기록합니다.' },
        { src: '../assets/img/screen-fhms-3.png', title: 'CCP 문서함', desc: 'CCP 점검 기록의 작성·결재 이력을 문서별로 관리합니다.' },
        { src: '../assets/img/screen-fhms-4.png', title: 'CCP 모니터링 일지', desc: '결재 완료된 CCP 점검 기록을 문서 형태로 보관합니다.' },
        { src: '../assets/img/screen-fhms-5.png', title: 'CCP 온도 관리', desc: '굽기 등 중요관리점(CCP) 공정의 시작·종료 온도를 실시간으로 기록합니다.' }
      ],
      'panel-4': [
        { src: '../assets/img/screen-wms-1.png', title: '자재 입출고 현황', desc: '입고·출고 이력과 현재고·이전재고를 LOT 단위로 확인합니다.' },
        { src: '../assets/img/screen-wms-2.png', title: '원료 탱크 재고', desc: '저장탱크별 원재료 잔량을 실시간 게이지로 확인합니다.' },
        { src: '../assets/img/screen-wms-3.png', title: '창고 재고 현황판', desc: '창고·구역·랙 단위로 재고 적재 현황을 시각화합니다.' }
      ],
      'panel-5': [
        { src: '../assets/img/screen-mobile-1.png', title: '모바일 현황 대시보드', desc: '이번 달 주문·출고·생산 현황을 모바일에서 바로 확인합니다.' },
        { src: '../assets/img/screen-mobile-2.png', title: '모바일 생산·재고 현황', desc: '일자별 생산계획과 재고현황을 모바일에서 조회합니다.' }
      ]
    };

    var proofTrack = document.getElementById('proofTrack');
    var proofPrev = document.getElementById('proofPrev');
    var proofNext = document.getElementById('proofNext');
    var currentPanelId = null;
    var currentImgIdx = 0;
    var advanceTimer = null;

    function updateCaption(set){
      var item = set[currentImgIdx];
      if(proofCaptionTitle){ proofCaptionTitle.textContent = item.title; }
      if(proofCaptionDesc){ proofCaptionDesc.textContent = item.desc; }
      if(proofCount){ proofCount.textContent = (currentImgIdx + 1) + ' / ' + set.length; }
      if(proofDots){
        Array.prototype.forEach.call(proofDots.children, function(dot, i){
          dot.setAttribute('aria-selected', i === currentImgIdx ? 'true' : 'false');
        });
      }
    }

    function goToSlide(idx){
      var set = PROOF_SETS[currentPanelId];
      if(!set || !set.length || !proofTrack) return;
      currentImgIdx = ((idx % set.length) + set.length) % set.length;
      proofTrack.style.transform = 'translateX(-' + (currentImgIdx * 100) + '%)';
      updateCaption(set);
    }

    function buildDots(set){
      if(!proofDots) return;
      proofDots.innerHTML = '';
      set.forEach(function(item, i){
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        dot.setAttribute('aria-label', (i + 1) + '번째 화면: ' + item.title);
        dot.addEventListener('click', function(){ goToSlide(i); restartAdvanceTimer(); });
        proofDots.appendChild(dot);
      });
    }

    function restartAdvanceTimer(){
      if(advanceTimer){ clearInterval(advanceTimer); }
      advanceTimer = setInterval(function(){ goToSlide(currentImgIdx + 1); }, PROOF_ADVANCE_MS);
    }

    function openPanel(panelId){
      currentPanelId = panelId;
      currentImgIdx = 0;
      var set = PROOF_SETS[panelId] || [];
      if(!proofTrack) return;
      proofTrack.innerHTML = '';
      set.forEach(function(item, i){
        var slide = document.createElement('div');
        slide.className = 'proof-slide';
        var img = document.createElement('img');
        img.alt = item.title;
        img.loading = i === 0 ? 'eager' : 'lazy';
        img.decoding = 'async';
        if(i === 0){
          img.onload = function(){ if(proofShot){ proofShot.classList.add('has-real-image'); } };
          img.onerror = function(){ if(proofShot){ proofShot.classList.remove('has-real-image'); } };
        }
        img.src = item.src;
        slide.appendChild(img);
        proofTrack.appendChild(slide);
      });
      // 탭을 바꿀 때는 슬라이드 이동 애니메이션 없이 즉시 첫 화면으로 리셋합니다.
      proofTrack.style.transition = 'none';
      proofTrack.style.transform = 'translateX(0%)';
      void proofTrack.offsetWidth;
      proofTrack.style.transition = '';
      buildDots(set);
      updateCaption(set);
      restartAdvanceTimer();
    }

    function selectTab(idx, focusTab){
      tabs.forEach(function(t, i){
        var selected = i === idx;
        t.setAttribute('aria-selected', selected ? 'true' : 'false');
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if(panel){
          panel.hidden = !selected;
          panel.classList.toggle('active', selected);
        }
      });
      var activeTab = tabs[idx];
      openPanel(activeTab.getAttribute('aria-controls'));
      if(focusTab !== false){ tabs[idx].focus(); }
    }

    tabs.forEach(function(tab, idx){
      tab.addEventListener('click', function(){ selectTab(idx); });
      tab.addEventListener('keydown', function(e){
        var newIdx = null;
        if(e.key === 'ArrowRight' || e.key === 'ArrowDown'){ newIdx = (idx + 1) % tabs.length; }
        if(e.key === 'ArrowLeft' || e.key === 'ArrowUp'){ newIdx = (idx - 1 + tabs.length) % tabs.length; }
        if(newIdx !== null){ e.preventDefault(); selectTab(newIdx); }
      });
    });

    if(proofPrev){ proofPrev.addEventListener('click', function(){ goToSlide(currentImgIdx - 1); restartAdvanceTimer(); }); }
    if(proofNext){ proofNext.addEventListener('click', function(){ goToSlide(currentImgIdx + 1); restartAdvanceTimer(); }); }

    var proofPanelEl = document.querySelector('.proof-panel');
    if(proofPanelEl){
      proofPanelEl.addEventListener('mouseenter', function(){ if(advanceTimer){ clearInterval(advanceTimer); } });
      proofPanelEl.addEventListener('mouseleave', function(){ restartAdvanceTimer(); });
    }

    // 첫 화면에서도 바로 실제 화면이 보이도록, 포커스는 옮기지 않고 슬라이드를 미리 채워둡니다.
    if(tabs[0]){ selectTab(0, false); }
  }

  /* ---------- Industry tabs (industries.html) ---------- */
  var indTabs = document.getElementById('indTabs');
  if(indTabs){
    var iTabs = Array.prototype.slice.call(indTabs.querySelectorAll('[role="tab"]'));
    function selectIndTab(idx){
      iTabs.forEach(function(t, i){
        var selected = i === idx;
        t.setAttribute('aria-selected', selected ? 'true' : 'false');
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if(panel){
          panel.hidden = !selected;
          panel.classList.toggle('active', selected);
        }
      });
      iTabs[idx].focus();
    }
    iTabs.forEach(function(tab, idx){
      tab.addEventListener('click', function(){ selectIndTab(idx); });
      tab.addEventListener('keydown', function(e){
        var newIdx = null;
        if(e.key === 'ArrowRight' || e.key === 'ArrowDown'){ newIdx = (idx + 1) % iTabs.length; }
        if(e.key === 'ArrowLeft' || e.key === 'ArrowUp'){ newIdx = (idx - 1 + iTabs.length) % iTabs.length; }
        if(newIdx !== null){ e.preventDefault(); selectIndTab(newIdx); }
      });
    });
  }

  /* ---------- 무료 진단 전체화면 위저드 (contact.html) ---------- */
  var overlay = document.getElementById('diagOverlay');
  var form = document.getElementById('diagForm');
  if(overlay && form){
    var DIAG_EMAIL = 'bluebiz@blue-biz.co.kr';
    var status = document.getElementById('formStatus');
    var phoneRe = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
    var nextBtn = document.getElementById('diagNextBtn');
    var backBtn = document.getElementById('diagBack');
    var progressFill = document.getElementById('diagProgressFill');

    function setInvalid(rowId, invalid){
      var row = document.getElementById(rowId);
      if(row){ row.classList.toggle('invalid', invalid); }
    }
    function fieldVal(id){
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }

    /* ---- 업종별 추천 솔루션 ---- */
    var RECOMMEND_MAP = {
      '식품 제조': ['FHMS(HACCP 품질관리)', 'BlueFAC(MES)'],
      '금속·부품 제조': ['BlueFAC(MES)', 'BluePOP(IoT 데이터수집)'],
      '스마트조선': ['MoFAC·SelfFAC(모바일·클라우드)', 'BlueFAC(MES)'],
      '스마트팜·기타 제조': ['BluePOP(IoT 데이터수집)', 'FHMS(HACCP 품질관리)'],
      '기타 업종': ['BlueFAC(MES)', '상담 후 결정']
    };
    var solutionsGroupEl = form.querySelector('.big-choice-grid[data-group="solutions"]');
    var recoMsgEl = document.getElementById('recoMsg');
    function renderRecommendations(){
      var industry = fieldVal('f-industry');
      var list = RECOMMEND_MAP[industry] || [];
      if(!solutionsGroupEl) return;
      var labels = [];
      Array.prototype.slice.call(solutionsGroupEl.querySelectorAll('.big-choice')).forEach(function(btn){
        var isReco = list.indexOf(btn.getAttribute('data-value')) > -1;
        btn.classList.toggle('is-reco', isReco);
        if(isReco){
          var t = btn.querySelector('.bc-title');
          if(t){ labels.push(t.textContent); }
        }
      });
      if(recoMsgEl){
        if(industry && labels.length){
          recoMsgEl.innerHTML = '<b>「' + industry + '」</b>에는 <b>' + labels.join('</b> + <b>') + '</b> 조합을 추천해요!';
          recoMsgEl.classList.add('show');
        } else {
          recoMsgEl.classList.remove('show');
        }
      }
    }

    /* ---- 선택형 카드 그룹 (업종 / 관심 솔루션 / 도입 단계) ---- */
    var choiceGroups = Array.prototype.slice.call(form.querySelectorAll('.big-choice-grid'));
    choiceGroups.forEach(function(group){
      var key = group.getAttribute('data-group');
      var multi = group.getAttribute('data-multi') === 'true';
      var hiddenInput = document.getElementById('f-' + key);
      var btns = Array.prototype.slice.call(group.querySelectorAll('.big-choice'));

      function syncGroup(){
        var active = btns.filter(function(b){ return b.classList.contains('is-active'); });
        if(hiddenInput){
          hiddenInput.value = active.map(function(b){ return b.getAttribute('data-value'); }).join(', ');
        }
        var row = group.closest('.form-row') || group.closest('.wizard-step');
        if(row && active.length){ row.classList.remove('invalid'); }
        updateMailPreview();
        updateNextButtonState();
      }

      btns.forEach(function(btn){
        btn.addEventListener('click', function(){
          var wasActive = btn.classList.contains('is-active');
          if(multi){
            btn.classList.toggle('is-active');
          } else {
            btns.forEach(function(b){ b.classList.remove('is-active'); });
            if(!wasActive){ btn.classList.add('is-active'); }
          }
          syncGroup();
        });
      });
    });

    /* ---- 단계형 위저드: 화면이 한 단계씩 흘러가며 전환 ---- */
    var wizardSteps = Array.prototype.slice.call(form.querySelectorAll('.wizard-step'));
    var currentStep = 0;
    var STEP_LABELS = ['다음', '다음', '다음', '다음', '무료 진단 신청하기'];

    function isStepValid(idx){
      if(idx === 0){ return !!fieldVal('f-company') && !!fieldVal('f-name') && phoneRe.test(fieldVal('f-phone')); }
      if(idx === 1){ return !!fieldVal('f-industry'); }
      if(idx === 2){ return !!fieldVal('f-solutions'); }
      if(idx === 3){ return !!fieldVal('f-stage'); }
      if(idx === 4){ var c = document.getElementById('f-consent'); return !!c && c.checked; }
      return true;
    }
    function validateStep(idx){
      if(idx === 0){
        var ok = true;
        setInvalid('row-company', !fieldVal('f-company')); if(!fieldVal('f-company')) ok = false;
        var contactInvalid = !fieldVal('f-name') || !phoneRe.test(fieldVal('f-phone'));
        setInvalid('row-contact', contactInvalid); if(contactInvalid) ok = false;
        return ok;
      }
      if(idx === 1){ var v1 = !!fieldVal('f-industry'); setInvalid('row-industry', !v1); return v1; }
      if(idx === 2){ var v2 = !!fieldVal('f-solutions'); setInvalid('row-solutions', !v2); return v2; }
      if(idx === 3){ var v3 = !!fieldVal('f-stage'); setInvalid('row-stage', !v3); return v3; }
      return isStepValid(idx);
    }
    function updateNextButtonState(){
      if(!nextBtn) return;
      nextBtn.disabled = !isStepValid(currentStep);
    }
    function renderNextLabel(){
      if(!nextBtn) return;
      var isLast = currentStep === wizardSteps.length - 1;
      nextBtn.innerHTML = isLast
        ? STEP_LABELS[currentStep] + '<svg><use href="#ic-mail"/></svg>'
        : STEP_LABELS[currentStep] + '<svg><use href="#ic-arrow"/></svg>';
    }

    function goToStep(idx){
      if(idx < 0 || idx >= wizardSteps.length || idx === currentStep) return;
      var from = wizardSteps[currentStep];
      var to = wizardSteps[idx];

      from.classList.add('is-leaving');
      requestAnimationFrame(function(){ from.classList.add('leave-active'); });
      setTimeout(function(){
        from.classList.remove('is-active', 'is-leaving', 'leave-active');
      }, 170);

      currentStep = idx;
      setTimeout(function(){
        void to.offsetWidth;
        to.classList.add('is-active');
      }, 90);

      if(backBtn){ backBtn.classList.toggle('show', idx > 0); }
      if(progressFill){
        var pct = wizardSteps.length > 1 ? (idx / (wizardSteps.length - 1)) * 100 : 0;
        progressFill.style.width = pct + '%';
      }
      if(idx === 2){ renderRecommendations(); }
      if(idx === wizardSteps.length - 1){ updateMailPreview(); }
      renderNextLabel();
      updateNextButtonState();

      var viewport = form.querySelector('.wizard-viewport');
      if(viewport){ viewport.scrollTop = 0; }
    }

    if(backBtn){
      backBtn.addEventListener('click', function(){ goToStep(currentStep - 1); });
    }

    /* ---- 오버레이 열기/닫기 ---- */
    function openOverlay(){
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.classList.add('diag-open');
      var firstInput = document.getElementById('f-company');
      if(firstInput){ setTimeout(function(){ firstInput.focus(); }, 300); }
    }
    function closeOverlay(){
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('diag-open');
    }
    var startBtn = document.getElementById('startDiagBtn');
    if(startBtn){ startBtn.addEventListener('click', openOverlay); }
    var closeBtn = document.getElementById('diagClose');
    if(closeBtn){ closeBtn.addEventListener('click', closeOverlay); }
    var doneBtn = document.getElementById('diagDoneBtn');
    if(doneBtn){ doneBtn.addEventListener('click', closeOverlay); }
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && overlay.classList.contains('is-open')){ closeOverlay(); }
    });

    /* ---- 실시간 신청 내용 미리보기 ---- */
    var previewBody = document.getElementById('mailPreviewBody');
    function buildTemplate(data){
      var lines = [
        '■ 블루비즈 무료 진단 신청서',
        '',
        '- 회사명: ' + (data.company || '(미입력)'),
        '- 담당자명: ' + (data.name || '(미입력)'),
        '- 연락처: ' + (data.phone || '(미입력)'),
        '- 업종: ' + (data.industry || '(미선택)'),
        '- 관심 솔루션: ' + (data.solutions || '(미선택)'),
        '- 도입 희망 단계: ' + (data.stage || '(미선택)'),
        '- 추가 전달 내용: ' + (data.interest || '(없음)'),
        '- 개인정보 수집·이용 동의: ' + (data.consent ? '동의함' : '(미동의)'),
        '- 신청 일시: ' + data.timestamp,
        '',
        '본 메일은 블루비즈 홈페이지 무료 진단 신청 양식을 통해 작성되었습니다.'
      ];
      return lines.join('\n');
    }
    function collectFormData(){
      return {
        company: fieldVal('f-company'),
        name: fieldVal('f-name'),
        phone: fieldVal('f-phone'),
        industry: fieldVal('f-industry'),
        solutions: fieldVal('f-solutions'),
        stage: fieldVal('f-stage'),
        interest: fieldVal('f-interest'),
        consent: document.getElementById('f-consent').checked,
        timestamp: new Date().toLocaleString('ko-KR')
      };
    }
    function updateMailPreview(){
      if(!previewBody) return;
      previewBody.textContent = buildTemplate(collectFormData());
    }
    function clearLiveInvalid(){
      if(fieldVal('f-company')){ setInvalid('row-company', false); }
      if(fieldVal('f-name') && phoneRe.test(fieldVal('f-phone'))){ setInvalid('row-contact', false); }
    }
    ['f-company','f-name','f-phone','f-interest'].forEach(function(id){
      var el = document.getElementById(id);
      if(el){
        el.addEventListener('input', function(){
          clearLiveInvalid();
          updateMailPreview();
          updateNextButtonState();
        });
      }
    });
    var consentBox = document.getElementById('f-consent');
    if(consentBox){
      consentBox.addEventListener('change', function(){
        updateMailPreview();
        updateNextButtonState();
      });
    }
    updateMailPreview();
    renderNextLabel();
    updateNextButtonState();

    form.addEventListener('submit', function(e){
      e.preventDefault();
      var lastIdx = wizardSteps.length - 1;

      if(currentStep < lastIdx){
        if(validateStep(currentStep)){ goToStep(currentStep + 1); }
        return;
      }

      var data = collectFormData();
      var valid = true;
      var firstInvalidStep = null;
      function markStep(rowId, bad, stepIdx){
        setInvalid(rowId, bad);
        if(bad){ valid = false; if(firstInvalidStep === null){ firstInvalidStep = stepIdx; } }
      }
      markStep('row-company', !data.company, 0);
      markStep('row-contact', !data.name || !phoneRe.test(data.phone), 0);
      markStep('row-industry', !data.industry, 1);
      markStep('row-solutions', !data.solutions, 2);
      markStep('row-stage', !data.stage, 3);

      status.className = 'form-status';
      status.textContent = '';

      if(!data.consent){
        valid = false;
        status.classList.add('error');
        status.textContent = '개인정보 수집 및 이용에 동의해 주세요.';
      }

      if(!valid){
        if(!status.textContent){
          status.classList.add('error');
          status.textContent = '입력 내용을 다시 확인해 주세요.';
        }
        if(firstInvalidStep !== null){ goToStep(firstInvalidStep); }
        return;
      }

      var template = buildTemplate(data);
      var subject = '[무료 진단 신청] ' + data.company;
      // TODO: 백엔드가 준비되면 이 mailto 대신 실제 API(fetch)로 교체
      var mailtoUrl = 'mailto:' + DIAG_EMAIL
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(template);

      nextBtn.disabled = true;
      nextBtn.textContent = '이메일 작성 중...';

      setTimeout(function(){
        overlay.classList.add('is-success');
        status.textContent = '';

        var mailBody = document.getElementById('mailTemplateBody');
        if(mailBody){ mailBody.textContent = template; }
        var mailLink = document.getElementById('mailtoLink');
        if(mailLink){ mailLink.href = mailtoUrl; }
        var mailTo = document.getElementById('mailToAddress');
        if(mailTo){ mailTo.textContent = DIAG_EMAIL; }

        // 메일 클라이언트가 설치된 환경이면 자동으로 작성 화면이 열립니다.
        window.location.href = mailtoUrl;
      }, 500);
    });

    var copyBtn = document.getElementById('copyTemplateBtn');
    if(copyBtn){
      copyBtn.addEventListener('click', function(){
        var mailBody = document.getElementById('mailTemplateBody');
        var toast = document.getElementById('copyToast');
        if(!mailBody) return;
        var text = mailBody.textContent;
        function showToast(){
          if(toast){
            toast.classList.add('show');
            setTimeout(function(){ toast.classList.remove('show'); }, 2200);
          }
        }
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(text).then(showToast).catch(function(){
            fallbackCopy(text); showToast();
          });
        } else {
          fallbackCopy(text); showToast();
        }
      });
    }
    function fallbackCopy(text){
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try{ document.execCommand('copy'); } catch(err){ /* noop */ }
      document.body.removeChild(ta);
    }
  }
})();
