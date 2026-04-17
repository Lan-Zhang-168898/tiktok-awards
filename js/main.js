// TikTok Shop Stars Awards - Main JavaScript

// ==================== Global Data Store ====================
const AppData = {
  global: null,
  regional: {
    us: null,
    eu: null,
    sea: null,
    latam: null
  },
  rankings: null,
  currentYear: '2025',
  currentRegion: 'us',
  currentPeriod: 'H1项目奖', // For Regional page: H1项目奖 | H2项目奖 | H2个人奖
  currentHalf: 'H1', // For Global page: H1 | H2
  currentLatamQuarter: 'Q1' // For LATAM individual awards: Q1 | Q2 | Q3 | Q4
};

// ==================== Utility Functions ====================
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

function setUrlParam(param, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(param, value);
  window.history.pushState({}, '', url);
}

function formatCurrency(amount) {
  if (!amount) return 'TBD';
  return '$' + Number(amount).toLocaleString();
}

function formatBonus(amount) {
  if (!amount || amount === 0) return 'TBD';
  if (amount >= 1000000) {
    return '$' + (amount / 1000000).toFixed(1) + 'M';
  }
  if (amount >= 1000) {
    return '$' + (amount / 1000).toFixed(0) + 'K';
  }
  return '$' + amount;
}

function truncateText(text, maxLength = 200) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// ==================== Navigation Functions ====================
function highlightNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('href') === currentPage) {
      item.classList.add('active');
    }
  });
  
  // Handle index.html
  if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
    const homeNav = document.querySelector('.nav-item[href="index.html"]');
    if (homeNav) homeNav.classList.add('active');
  }
}

function initYearNavigation() {
  const yearBtns = document.querySelectorAll('.year-btn');
  const urlYear = getUrlParam('year') || '2025';
  
  AppData.currentYear = urlYear;
  
  yearBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.year === urlYear) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => {
      if (btn.dataset.year === '2026') return; // Coming Soon
      const page = window.location.pathname.split('/').pop();
      const baseUrl = window.location.href.split('?')[0].replace(/\/[^\/]*$/, '/');
      window.location.href = `${baseUrl}${page}?year=${btn.dataset.year}`;
    });
  });
}

function initRegionNavigation() {
  const regionBtns = document.querySelectorAll('.region-btn');
  const urlRegion = getUrlParam('region') || 'us';
  
  AppData.currentRegion = urlRegion;
  
  regionBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.region === urlRegion) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => {
      const page = window.location.pathname.split('/').pop();
      const baseUrl = window.location.href.split('?')[0].replace(/\/[^\/]*$/, '/');
      window.location.href = `${baseUrl}${page}?year=${AppData.currentYear}&region=${btn.dataset.region}`;
    });
  });
}

function initDeptNavigation() {
  const deptBtns = document.querySelectorAll('.dept-btn');
  const urlDept = getUrlParam('dept');
  
  if (urlDept) {
    AppData.currentDept = urlDept;
  }
  
  deptBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.dept === urlDept) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => {
      const page = window.location.pathname.split('/').pop();
      const baseUrl = window.location.href.split('?')[0].replace(/\/[^\/]*$/, '/');
      window.location.href = `${baseUrl}${page}?year=${AppData.currentYear}&dept=${btn.dataset.dept}`;
    });
  });
}

// ==================== Data Loading Functions ====================
async function loadData(level, region = null) {
  try {
    let dataFile;
    
    if (level === 'global') {
      dataFile = 'data/global.json';
    } else if (level === 'regional' && region) {
      dataFile = `data/${region}.json`;
    }
    
    const response = await fetch(dataFile);
    if (!response.ok) throw new Error(`Failed to load ${dataFile}`);
    
    const data = await response.json();
    
    if (level === 'global') {
      AppData.global = data;
    } else if (level === 'regional') {
      AppData.regional[region] = data;
    }
    
    return data;
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
}

async function loadRankings() {
  try {
    const response = await fetch('data/rankings.json');
    if (!response.ok) throw new Error('Failed to load rankings');
    
    const data = await response.json();
    AppData.rankings = data;
    return data;
  } catch (error) {
    console.error('Error loading rankings:', error);
    return null;
  }
}

// ==================== Helper Functions for H1+H2 Data ====================

// Get H1 project awards only
function getH1ProjectAwards(data) {
  if (!data) return [];
  return data['H1项目奖'] || [];
}

// Get H2 project awards only
function getH2ProjectAwards(data) {
  if (!data) return [];
  return data['H2项目奖'] || [];
}

// Combine H1 and H2 project awards into single array
function getAllProjectAwards(data) {
  if (!data) return [];
  const h1Awards = data['H1项目奖'] || [];
  const h2Awards = data['H2项目奖'] || [];
  return [...h1Awards, ...h2Awards];
}

// Get all individual awards
function getAllIndividualAwards(data) {
  if (!data) return [];
  return data['H2个人奖'] || [];
}

// Get individual awards by quarter (for LATAM)
function getIndividualAwardsByQuarter(data, quarter) {
  if (!data) return [];
  const allIndividual = data['H2个人奖'] || [];
  return allIndividual.filter(a => a.quarter === quarter || a.period === quarter);
}

// ==================== Ranking Functions ====================

// Calculate FULL YEAR Top 3 for Global (combining H1 + H2)
function calculateGlobalTop3FullYear(globalData) {
  if (!globalData) return [];
  
  const allAwards = getAllProjectAwards(globalData);
  const memberScores = {};
  
  // Helper to get safe department value
  const getSafeDept = (dept, defaultVal) => {
    if (dept && dept !== 'undefined' && dept !== 'null' && dept !== '') return dept;
    return defaultVal || 'Global';
  };
  
  allAwards.forEach(award => {
    if (!award.members) return;
    award.members.forEach(memberName => {
      const key = memberName;
      if (!memberScores[key]) {
        memberScores[key] = {
          name: memberName,
          score: 0,
          awards: 0,
          email: award.email || '',
          department: getSafeDept(award.department, 'Global')
        };
      }
      memberScores[key].score += 5; // Global = 5 points
      memberScores[key].awards += 1;
    });
  });
  
  return Object.values(memberScores)
    .sort((a, b) => b.score - a.score || b.awards - a.awards)
    .slice(0, 3);
}

// Calculate FULL YEAR Top 10 for Global (combining H1 + H2)
function calculateGlobalTop10FullYear(globalData) {
  if (!globalData) return [];
  
  const allAwards = getAllProjectAwards(globalData);
  const memberScores = {};
  
  const getSafeDept = (dept, defaultVal) => {
    if (dept && dept !== 'undefined' && dept !== 'null' && dept !== '') return dept;
    return defaultVal || 'Global';
  };
  
  allAwards.forEach(award => {
    if (!award.members) return;
    award.members.forEach(memberName => {
      const key = memberName;
      if (!memberScores[key]) {
        memberScores[key] = {
          name: memberName,
          score: 0,
          awards: 0,
          email: award.email || '',
          department: getSafeDept(award.department, 'Global')
        };
      }
      memberScores[key].score += 5;
      memberScores[key].awards += 1;
    });
  });
  
  return Object.values(memberScores)
    .sort((a, b) => b.score - a.score || b.awards - a.awards)
    .slice(0, 10)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

// Calculate Top 3 by period (H1 or H2 only)
function calculateGlobalTop3(globalData, half) {
  if (!globalData) return [];
  
  const memberScores = {};
  
  const getSafeDept = (dept, defaultVal) => {
    if (dept && dept !== 'undefined' && dept !== 'null' && dept !== '') return dept;
    return defaultVal || 'Global';
  };
  
  let awards = [];
  if (half === 'H1') {
    awards = getH1ProjectAwards(globalData);
  } else {
    awards = getH2ProjectAwards(globalData);
  }
  
  awards.forEach(award => {
    if (!award.members) return;
    award.members.forEach(memberName => {
      const key = memberName;
      if (!memberScores[key]) {
        memberScores[key] = {
          name: memberName,
          score: 0,
          awards: 0,
          email: award.email || '',
          department: getSafeDept(award.department, 'Global')
        };
      }
      memberScores[key].score += 5;
      memberScores[key].awards += 1;
    });
  });
  
  return Object.values(memberScores)
    .sort((a, b) => b.score - a.score || b.awards - a.awards)
    .slice(0, 3);
}

function calculateRegionTop3(regionData, region, period) {
  if (!regionData) return [];
  
  let memberScores = {};
  
  const getSafeDept = (dept, reg, defaultVal) => {
    if (dept && dept !== 'undefined' && dept !== 'null' && dept !== '') return dept;
    if (reg && reg !== 'undefined' && reg !== 'null' && reg !== '') return reg;
    return defaultVal || 'TikTok Shop';
  };
  
  if (period === 'H1项目奖') {
    const h1Awards = getH1ProjectAwards(regionData);
    h1Awards.forEach(award => {
      if (!award.members) return;
      award.members.forEach(memberName => {
        const key = memberName;
        if (!memberScores[key]) {
          memberScores[key] = {
            name: memberName,
            score: 0,
            awards: 0,
            email: award.email || '',
            department: getSafeDept(award.department, region, 'Regional')
          };
        }
        memberScores[key].score += 3;
        memberScores[key].awards += 1;
      });
    });
  } else if (period === 'H2项目奖') {
    const h2Awards = getH2ProjectAwards(regionData);
    h2Awards.forEach(award => {
      if (!award.members) return;
      award.members.forEach(memberName => {
        const key = memberName;
        if (!memberScores[key]) {
          memberScores[key] = {
            name: memberName,
            score: 0,
            awards: 0,
            email: award.email || '',
            department: getSafeDept(award.department, region, 'Regional')
          };
        }
        memberScores[key].score += 3;
        memberScores[key].awards += 1;
      });
    });
  } else if (period === 'H2个人奖') {
    const individualAwards = region === 'latam' 
      ? getIndividualAwardsByQuarter(regionData, AppData.currentLatamQuarter)
      : getAllIndividualAwards(regionData);
    
    individualAwards.forEach(award => {
      // Handle both winner_name and members array formats
      const memberNames = award.members || (award.winner_name ? [award.winner_name] : []);
      const dept = getSafeDept(award.department, region, 'Regional');
      
      memberNames.forEach(memberName => {
        const memberNameStr = typeof memberName === 'string' ? memberName : memberName.name;
        if (memberNameStr) {
          if (!memberScores[memberNameStr]) {
            memberScores[memberNameStr] = {
              name: memberNameStr,
              score: 0,
              awards: 0,
              email: award.email || '',
              department: dept
            };
          }
          memberScores[memberNameStr].score += 3;
          memberScores[memberNameStr].awards += 1;
        }
      });
    });
  }
  
  return Object.values(memberScores)
    .sort((a, b) => b.score - a.score || b.awards - a.awards)
    .slice(0, 3);
}

// Full Year Regional Top 3 - ignores award type filter, combines all regional awards
function calculateRegionTop3FullYear(regionData, region) {
  if (!regionData) return [];
  
  let memberScores = {};
  
  const getSafeDept = (dept, reg, defaultVal) => {
    if (dept && dept !== 'undefined' && dept !== 'null' && dept !== '') return dept;
    if (reg && reg !== 'undefined' && reg !== 'null' && reg !== '') return reg;
    return defaultVal || 'Regional';
  };
  
  // Include ALL award types for full year ranking
  const h1Awards = getH1ProjectAwards(regionData);
  const h2Awards = getH2ProjectAwards(regionData);
  const allIndividualAwards = region === 'latam' 
    ? getIndividualAwardsByQuarter(regionData, 'Q1').concat(
        getIndividualAwardsByQuarter(regionData, 'Q2'),
        getIndividualAwardsByQuarter(regionData, 'Q3'),
        getIndividualAwardsByQuarter(regionData, 'Q4')
      )
    : getAllIndividualAwards(regionData);
  
  // Process all awards (3 pts each)
  [...h1Awards, ...h2Awards].forEach(award => {
    if (!award.members) return;
    const dept = getSafeDept(award.department, region, 'Regional');
    award.members.forEach(memberName => {
      if (!memberScores[memberName]) {
        memberScores[memberName] = { name: memberName, score: 0, awards: 0, department: dept };
      }
      memberScores[memberName].score += 3;
      memberScores[memberName].awards += 1;
    });
  });
  
  allIndividualAwards.forEach(award => {
    // Handle both winner_name and members array formats
    const memberNames = award.members || (award.winner_name ? [award.winner_name] : []);
    const dept = getSafeDept(award.department, award.region, 'Regional');
    
    memberNames.forEach(memberName => {
      const memberNameStr = typeof memberName === 'string' ? memberName : memberName.name;
      if (memberNameStr) {
        if (!memberScores[memberNameStr]) {
          memberScores[memberNameStr] = { name: memberNameStr, score: 0, awards: 0, department: dept };
        }
        memberScores[memberNameStr].score += 3;
        memberScores[memberNameStr].awards += 1;
      }
    });
  });
  
  return Object.values(memberScores)
    .sort((a, b) => b.score - a.score || b.awards - a.awards)
    .slice(0, 3);
}

// ==================== Render Functions ====================
function renderPodium(top3, containerId, title) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (top3.length === 0) {
    container.innerHTML = '<div class="no-data-msg">No rankings available for this selection</div>';
    return;
  }
  
  const getDept = (item) => {
    if (item.department && item.department !== 'undefined') return item.department;
    if (item.region && item.region !== 'undefined') return item.region;
    return 'TikTok Shop';
  };
  
  const getScore = (item) => item.score || item.points || 0;
  
  // Calculate actual rank based on scores (ties get same rank)
  const calculateRanks = (items) => {
    const sortedScores = [...new Set(items.map(getScore))].sort((a, b) => b - a);
    return items.map(item => {
      const score = getScore(item);
      return sortedScores.indexOf(score) + 1;
    });
  };
  
  const ranks = calculateRanks(top3);
  
  const getMedal = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };
  
  const getPodiumClass = (rank) => {
    if (rank === 1) return 'first';
    if (rank === 2) return 'second';
    if (rank === 3) return 'third';
    return '';
  };
  
  let html = `
    <div class="podium">
      ${top3[1] ? `
        <div class="podium-item ${getPodiumClass(ranks[1])}">
          <div class="podium-medal">${getMedal(ranks[1])}</div>
          <div class="podium-rank">#${ranks[1]}</div>
          <div class="podium-name">${top3[1].name}</div>
          <div class="podium-dept">${getDept(top3[1])}</div>
          <div class="podium-score">${getScore(top3[1])} pts</div>
        </div>
      ` : ''}
      ${top3[0] ? `
        <div class="podium-item ${getPodiumClass(ranks[0])}">
          <div class="podium-medal">${getMedal(ranks[0])}</div>
          <div class="podium-rank">#${ranks[0]}</div>
          <div class="podium-name">${top3[0].name}</div>
          <div class="podium-dept">${getDept(top3[0])}</div>
          <div class="podium-score">${getScore(top3[0])} pts</div>
        </div>
      ` : ''}
      ${top3[2] ? `
        <div class="podium-item ${getPodiumClass(ranks[2])}">
          <div class="podium-medal">${getMedal(ranks[2])}</div>
          <div class="podium-rank">#${ranks[2]}</div>
          <div class="podium-name">${top3[2].name}</div>
          <div class="podium-dept">${getDept(top3[2])}</div>
          <div class="podium-score">${getScore(top3[2])} pts</div>
        </div>
      ` : ''}
    </div>
  `;
  
  container.innerHTML = html;
}

function renderRankingList(rankings, startRank = 4, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !rankings || rankings.length === 0) return;
  
  let html = '<div class="ranking-list">';
  
  // rankings already contains items starting from the correct rank
  for (let i = 0; i < rankings.length; i++) {
    const r = rankings[i];
    html += `
      <div class="ranking-item">
        <span class="ranking-rank">#${r.rank || i + startRank}</span>
        <span class="ranking-name">${r.name}</span>
        <span class="ranking-dept">${r.department || r.region || ''}</span>
        <span class="ranking-score">${r.points || r.score || 0} pts</span>
      </div>
    `;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

// ==================== Card Interaction Functions ====================

// Toggle like (heart)
function toggleLike(cardId, awardType, awardName) {
  const storageKey = `like_${cardId}`;
  let likes = JSON.parse(localStorage.getItem('likes') || '{}');
  
  if (likes[storageKey]) {
    delete likes[storageKey];
  } else {
    likes[storageKey] = {
      type: awardType,
      name: awardName,
      timestamp: Date.now()
    };
  }
  
  localStorage.setItem('likes', JSON.stringify(likes));
  updateLikeDisplay(cardId, likes[storageKey]);
}

function updateLikeDisplay(cardId, isLiked) {
  const likeBtn = document.querySelector(`[data-card-id="${cardId}"] .like-btn`);
  if (likeBtn) {
    const countSpan = likeBtn.querySelector('.like-count');
    if (countSpan) {
      countSpan.textContent = isLiked ? '1' : '0';
    }
    if (isLiked) {
      likeBtn.classList.add('liked');
    } else {
      likeBtn.classList.remove('liked');
    }
  }
}

function getLikeCount(cardId) {
  const storageKey = `like_${cardId}`;
  const likes = JSON.parse(localStorage.getItem('likes') || '{}');
  return likes[storageKey] ? 1 : 0;
}

// ==================== Comment Functions ====================
function showCommentsModal(cardId, awardName, awardType) {
  const modal = document.getElementById('comments-modal');
  const modalTitle = document.getElementById('comments-modal-title');
  const commentList = document.getElementById('comment-list');
  const commentInput = document.getElementById('comment-input');
  
  if (!modal) return;
  
  modalTitle.textContent = `${awardName}`;
  
  // Load existing comments
  const storageKey = `comments_${cardId}`;
  const comments = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  if (comments.length === 0) {
    commentList.innerHTML = '<div class="no-comments">No comments yet. Be the first!</div>';
  } else {
    commentList.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-author">${c.author || 'Anonymous'}</div>
        <div class="comment-text">${c.text}</div>
        <div class="comment-date">${new Date(c.timestamp).toLocaleDateString()}</div>
      </div>
    `).join('');
  }
  
  // Store current card info
  modal.dataset.cardId = cardId;
  modal.dataset.awardName = awardName;
  modal.dataset.awardType = awardType;
  
  // Clear and focus input
  if (commentInput) {
    commentInput.value = '';
    commentInput.focus();
  }
  
  modal.classList.add('active');
}

function submitComment() {
  const modal = document.getElementById('comments-modal');
  const commentInput = document.getElementById('comment-input');
  const commentList = document.getElementById('comment-list');
  
  if (!modal || !commentInput) return;
  
  const text = commentInput.value.trim();
  if (!text) return;
  
  const storageKey = `comments_${modal.dataset.cardId}`;
  const comments = JSON.parse(localStorage.getItem(storageKey) || '[]');
  
  comments.push({
    text: text,
    author: 'You',
    timestamp: Date.now()
  });
  
  localStorage.setItem(storageKey, JSON.stringify(comments));
  commentInput.value = '';
  
  // Update display
  if (comments.length === 1) {
    commentList.innerHTML = '';
  }
  commentList.innerHTML += `
    <div class="comment-item">
      <div class="comment-author">You</div>
      <div class="comment-text">${text}</div>
      <div class="comment-date">Just now</div>
    </div>
  `;
}

function closeCommentsModal() {
  const modal = document.getElementById('comments-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// ==================== Share/Poster Functions ====================

// ==================== Share Modal Functions ====================
function showShareModalFromBtn(btn) {
  const projectName = btn.dataset.project;
  const teamAward = btn.dataset.award;
  const bonus = btn.dataset.bonus;
  const reason = btn.dataset.reason;
  const members = JSON.parse(btn.dataset.members || '[]');
  showShareModal(projectName, teamAward, bonus, reason, members);
}

function showShareModal(projectName, teamAward, bonus, reason, members) {
  console.log('showShareModal called:', { projectName, teamAward, bonus });
  
  const modal = document.getElementById('share-modal');
  const modalTitle = document.getElementById('share-modal-title');
  const posterPreview = document.getElementById('poster-preview');
  
  if (!modal) {
    console.error('Share modal not found');
    return;
  }
  
  modalTitle.textContent = 'Share Award';
  
  // Format members list
  const memberNames = Array.isArray(members) ? members.map(m => m.name || m).join(', ') : members;
  
  // Generate poster HTML
  posterPreview.innerHTML = `
    <div class="poster-container" id="poster-content">
      <div class="poster-gradient"></div>
      <div class="poster-content">
        <div class="poster-header">
          <div class="poster-brand">TikTok Shop Stars Awards</div>
        </div>
        
        <div class="poster-project">${projectName}</div>
        
        <div class="poster-award">${teamAward || 'Global Excellence Award'}</div>
        
        <div class="poster-bonus">${formatCurrency(bonus)}</div>
        
        <div class="poster-reason">${reason || 'Outstanding contribution to the team'}</div>
        
        <div class="poster-members-label">Team Members</div>
        <div class="poster-members">${memberNames}</div>
        
        <div class="poster-footer">
          <div class="poster-line"></div>
          <div class="poster-brand-footer">TikTok Shop</div>
        </div>
      </div>
    </div>
  `;
  
  modal.classList.add('active');
}

function closeShareModal() {
  const modal = document.getElementById('share-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

async function downloadPoster() {
  const posterContent = document.getElementById('poster-content');
  if (!posterContent) {
    alert('Poster content not found');
    return;
  }
  
  try {
    // Check if html2canvas is available
    if (typeof html2canvas === 'undefined') {
      // Try loading dynamically
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    
    const canvas = await html2canvas(posterContent, {
      backgroundColor: '#0d1b3e',
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    // Convert to image and download
    const link = document.createElement('a');
    link.download = 'award-poster.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error generating poster:', error);
    alert('Failed to generate poster. Please try again.');
  }
}

// ==================== Global Page Functions ====================
function renderGlobalAwards(data, containerId, half) {
  const container = document.getElementById(containerId);
  if (!container || !data) {
    console.error('renderGlobalAwards: missing container or data', { container: !!container, data: !!data });
    return;
  }
  
  console.log('renderGlobalAwards called:', { half, hasH1: !!data['H1项目奖'], hasH2: !!data['H2项目奖'], h2Count: (data['H2项目奖'] || []).length });
  
  let awards = [];
  if (half === 'H1') {
    awards = getH1ProjectAwards(data);
  } else {
    awards = getH2ProjectAwards(data);
  }
  
  console.log('Awards fetched:', awards.length, 'for half:', half);
  
  if (awards.length === 0) {
    container.innerHTML = '<div class="no-data-msg">No awards available for this period</div>';
    return;
  }
  
  // Group by project name
  const projectGroups = {};
  awards.forEach(award => {
    const key = award.project_name;
    if (!projectGroups[key]) {
      projectGroups[key] = {
        project_name: award.project_name,
        team_award: award.team_award,
        bonus: award.bonus,
        reason: award.reason,
        members: [],
        department: award.department,
        period: award.period,
        project_english_name: award.project_english_name
      };
    }
    award.members.forEach(m => {
      if (!projectGroups[key].members.find(mem => mem.name === m)) {
        projectGroups[key].members.push({ name: m, email: award.email });
      }
    });
  });
  
  console.log('Project groups:', Object.keys(projectGroups));
  
  let html = '<div class="awards-grid">';
  
  Object.values(projectGroups).forEach(project => {
    const cardId = `global_${project.project_name.replace(/\s+/g, '_')}`;
    const likeCount = getLikeCount(cardId);
    const reasonText = project.reason || '';
    
    // Handle award name display - if team_award is "Yes" or empty, show default
    const awardName = (project.team_award && project.team_award !== 'Yes' && project.team_award !== 'true') 
      ? project.team_award 
      : 'Global E-commerce Impactful Projects';
    
    html += `
      <div class="card project-card" data-card-id="${cardId}">
        <div class="card-header">
          <span class="card-icon">🏆</span>
          <span class="card-title">${project.project_english_name || project.project_name}</span>
        </div>
        <div class="card-body">
          <div class="card-period">${half}</div>
          <div class="card-award">
            <span class="card-award-name">🏆 ${awardName}</span>
          </div>
          <div class="card-amount">${formatCurrency(project.bonus)}</div>
          <div class="card-reason-scroll">
            ${reasonText}
          </div>
        </div>
        <div class="card-footer">
          <button class="members-btn" onclick="showMembersModal('${project.project_name.replace(/'/g, "\\'")}', ${JSON.stringify(project.members).replace(/"/g, '&quot;')})">
            Team Members (${project.members.length})
          </button>
          <div class="card-actions">
            <button class="like-btn ${likeCount > 0 ? 'liked' : ''}" onclick="toggleLike('${cardId}', 'global_project', '${project.project_name.replace(/'/g, "\\'")}')">
              ❤️ <span class="like-count">${likeCount}</span>
            </button>
            <button class="comment-btn" onclick="showCommentsModal('${cardId}', '${project.project_name.replace(/'/g, "\\'")}', 'Global Project Award')">
              💬 Comment
            </button>
            <button class="share-btn" data-project="${project.project_name.replace(/'/g, "\\'")}" data-award="${awardName}" data-bonus="${project.bonus || ''}" data-reason="${(reasonText || '').replace(/'/g, "\\'").replace(/"/g, '&quot;')}" data-members='${JSON.stringify(project.members).replace(/'/g, "&#39;")}' onclick="showShareModalFromBtn(this)">
              📤 Share
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// ==================== Regional Page Functions ====================
function renderRegionalAwards(data, containerId, period, region) {
  const container = document.getElementById(containerId);
  if (!container || !data) return;
  
  let html = '';
  
  // LATAM quarter awards (Q1, Q2, Q3, Q4)
  if (['Q1', 'Q2', 'Q3', 'Q4'].includes(period)) {
    const quarterAwards = getIndividualAwardsByQuarter(data, period);
    if (quarterAwards.length === 0) {
      html = `<div class="no-data-msg">No ${period} individual awards available for LATAM</div>`;
    } else {
      html = renderIndividualCards(quarterAwards, region, period);
    }
  } else if (period === 'H1项目奖') {
    const h1Awards = getH1ProjectAwards(data);
    if (h1Awards.length === 0) {
      html = '<div class="no-data-msg">No H1 project awards available for this region</div>';
    } else {
      html = renderProjectCards(h1Awards, region, 'H1');
    }
  } else if (period === 'H2项目奖') {
    const h2Awards = getH2ProjectAwards(data);
    if (h2Awards.length === 0) {
      html = '<div class="no-data-msg">No H2 project awards available for this region</div>';
    } else {
      html = renderProjectCards(h2Awards, region, 'H2');
    }
  } else if (period === 'H2个人奖') {
    // Non-LATAM individual awards
    const individualAwards = getAllIndividualAwards(data);
    if (individualAwards.length === 0) {
      html = '<div class="no-data-msg">No individual awards (Stellar Contributors) available for this region</div>';
    } else {
      html = renderIndividualCards(individualAwards, region, 'H2');
    }
  }
  
  container.innerHTML = html;
}

function renderProjectCards(awards, region, half) {
  const projectGroups = {};
  awards.forEach(award => {
    const key = award.project_name;
    if (!projectGroups[key]) {
      projectGroups[key] = {
        project_name: award.project_name,
        team_award: award.team_award,
        bonus: award.bonus,
        reason: award.reason,
        members: [],
        department: award.department,
        region: award.region
      };
    }
    award.members.forEach(m => {
      if (!projectGroups[key].members.find(mem => mem.name === m)) {
        projectGroups[key].members.push({ name: m, email: award.email });
      }
    });
  });
  
  let html = '<div class="awards-grid">';
  
  Object.values(projectGroups).forEach(project => {
    const cardId = `regional_${region}_${project.project_name.replace(/\s+/g, '_')}`;
    const likeCount = getLikeCount(cardId);
    const reasonText = project.reason || '';
    
    // Handle award name display - if team_award is "Yes" or empty, show default
    const awardName = (project.team_award && project.team_award !== 'Yes' && project.team_award !== 'true') 
      ? project.team_award 
      : 'Impactful XFN Project';
    
    html += `
      <div class="card project-card" data-card-id="${cardId}">
        <div class="card-header">
          <span class="card-icon">🏆</span>
          <span class="card-title">${project.project_english_name || project.project_name}</span>
        </div>
        <div class="card-body">
          <div class="card-period">${half}</div>
          <div class="card-award">
            <span class="card-award-name">🏆 ${awardName}</span>
          </div>
          <div class="card-amount">${formatCurrency(project.bonus)}</div>
          <div class="card-reason-scroll">
            ${reasonText}
          </div>
        </div>
        <div class="card-footer">
          <button class="members-btn" onclick="showMembersModal('${project.project_name.replace(/'/g, "\\'")}', ${JSON.stringify(project.members).replace(/"/g, '&quot;')})">
            Team Members (${project.members.length})
          </button>
          <div class="card-actions">
            <button class="like-btn ${likeCount > 0 ? 'liked' : ''}" onclick="toggleLike('${cardId}', 'regional_project', '${project.project_name.replace(/'/g, "\\'")}')">
              ❤️ <span class="like-count">${likeCount}</span>
            </button>
            <button class="comment-btn" onclick="showCommentsModal('${cardId}', '${project.project_name.replace(/'/g, "\\'")}', 'Regional Project Award')">
              💬 Comment
            </button>
            <button class="share-btn" data-project="${project.project_name.replace(/'/g, "\\'")}" data-award="${awardName}" data-bonus="${project.bonus || ''}" data-reason="${(reasonText || '').replace(/'/g, "\\'").replace(/"/g, '&quot;')}" data-members='${JSON.stringify(project.members).replace(/'/g, "&#39;")}' onclick="showShareModalFromBtn(this)">
              📤 Share
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

function renderIndividualCards(awards, region, half) {
  let html = '<div class="awards-grid">';
  
  awards.forEach(award => {
    // Handle both winner_name and members array formats
    const memberNames = award.members || (award.winner_name ? [award.winner_name] : []);
    
    memberNames.forEach((memberName, idx) => {
      const memberNameStr = typeof memberName === 'string' ? memberName : memberName.name;
      const cardId = `individual_${region}_${memberNameStr.replace(/\s+/g, '_')}_${idx}`;
      const likeCount = getLikeCount(cardId);
      const reasonText = award.reason || award.award_reason || '';
      const deptDisplay = award.department || award.region || region;
      
      // Determine award name based on region and department
      let awardName = award.project_name || award.team_award || 'Stellar Contributor';
      
      // For EU region, check if it's Japan-related
      if (region === 'eu' && award.project_name === 'BFCM/Tokutoku Thanks Sale Stellar Contributors') {
        const dept = (award.department || '').toLowerCase();
        if (dept.includes('jp') || dept.includes('japan')) {
          awardName = 'Tokutoku Thanks Sale Stellar Contributors';
        } else {
          awardName = 'BFCM Stellar Contributors';
        }
      }
      
      html += `
        <div class="card individual-card" data-card-id="${cardId}">
          <div class="card-header">
            <span class="card-icon">👤</span>
            <span class="card-title">${memberNameStr}</span>
          </div>
          <div class="card-meta">${deptDisplay}</div>
          <div class="card-body">
            <div class="card-award">
              <span class="card-award-name">🌟 ${awardName}</span>
            </div>
            <div class="card-amount">${formatCurrency(award.bonus)}</div>
            <div class="card-reason-scroll">
              ${reasonText}
            </div>
          </div>
          <div class="card-footer">
            <div class="card-actions">
              <button class="like-btn ${likeCount > 0 ? 'liked' : ''}" onclick="toggleLike('${cardId}', 'individual', '${memberNameStr.replace(/'/g, "\\'")}')">
                ❤️ <span class="like-count">${likeCount}</span>
              </button>
              <button class="comment-btn" onclick="showCommentsModal('${cardId}', '${memberNameStr.replace(/'/g, "\\'")}', 'Individual Award')">
                💬 Comment
              </button>
              <button class="share-btn" data-project="${memberNameStr.replace(/'/g, "\\'")}" data-award="${awardName}" data-bonus="${award.bonus || ''}" data-reason="${(reasonText || '').replace(/'/g, "\\'").replace(/"/g, '&quot;')}" data-members='${JSON.stringify([{name: memberNameStr, email: award.email || ''}]).replace(/'/g, "&#39;")}' onclick="showShareModalFromBtn(this)">
                📤 Share
              </button>
            </div>
          </div>
        </div>
      `;
    });
  });
  
  html += '</div>';
  return html;
}

// ==================== Modal Functions ====================
function showMembersModal(projectName, members) {
  const modal = document.getElementById('members-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  
  if (!modal) return;
  
  modalTitle.textContent = projectName;
  
  let membersHtml = '<div class="members-list">';
  members.forEach(member => {
    const name = member.name || member;
    const email = member.email || '';
    membersHtml += `
      <div class="member-item">
        <div class="member-name">${name}</div>
        <div class="member-email">${email}</div>
      </div>
    `;
  });
  membersHtml += '</div>';
  
  modalBody.innerHTML = membersHtml;
  modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('members-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Close modal on outside click
document.addEventListener('click', (e) => {
  const modal = document.getElementById('members-modal');
  if (e.target === modal) {
    closeModal();
  }
  const shareModal = document.getElementById('share-modal');
  if (e.target === shareModal) {
    closeShareModal();
  }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeShareModal();
  }
});

// ==================== Search Functions ====================
let searchData = null;

async function initSearch() {
  try {
    const [global, us, eu, sea, latam, rankings] = await Promise.all([
      fetch('data/global.json').then(r => r.json()).catch(() => null),
      fetch('data/us.json').then(r => r.json()).catch(() => null),
      fetch('data/eu.json').then(r => r.json()).catch(() => null),
      fetch('data/sea.json').then(r => r.json()).catch(() => null),
      fetch('data/latam.json').then(r => r.json()).catch(() => null),
      fetch('data/rankings.json').then(r => r.json()).catch(() => null)
    ]);
    
    searchData = {
      global,
      regional: { us, eu, sea, latam },
      rankings
    };
  } catch (error) {
    console.error('Error initializing search:', error);
  }
}

function performSearch(query) {
  if (!query || !searchData) return [];
  
  const results = [];
  const searchTerm = query.toLowerCase();
  
  if (searchData.global) {
    const h1Awards = searchData.global['H1项目奖'] || [];
    const h2Awards = searchData.global['H2项目奖'] || [];
    const allGlobalAwards = [...h1Awards, ...h2Awards];
    
    allGlobalAwards.forEach(award => {
      const matchName = award.project_name?.toLowerCase().includes(searchTerm);
      const matchMember = award.members?.some(m => m.toLowerCase().includes(searchTerm));
      const matchDept = award.department?.toLowerCase().includes(searchTerm);
      const matchReason = award.reason?.toLowerCase().includes(searchTerm);
      
      if (matchName || matchMember || matchDept || matchReason) {
        results.push({
          type: 'Project Award',
          level: 'Global',
          period: award.period || 'H1/H2',
          name: award.project_name,
          award: award.team_award,
          members: award.members,
          department: award.department,
          reason: award.reason
        });
      }
    });
  }
  
  ['us', 'eu', 'sea', 'latam'].forEach(region => {
    const data = searchData.regional[region];
    if (!data) return;
    
    const h1Awards = data['H1项目奖'] || [];
    const h2Awards = data['H2项目奖'] || [];
    const allRegionalAwards = [...h1Awards, ...h2Awards];
    
    allRegionalAwards.forEach(award => {
      const matchName = award.project_name?.toLowerCase().includes(searchTerm);
      const matchMember = award.members?.some(m => m.toLowerCase().includes(searchTerm));
      const matchDept = award.department?.toLowerCase().includes(searchTerm);
      
      if (matchName || matchMember || matchDept) {
        results.push({
          type: 'Project Award',
          level: `Regional - ${region.toUpperCase()}`,
          period: award.period || 'H1/H2',
          name: award.project_name,
          award: award.team_award,
          members: award.members,
          department: award.department
        });
      }
    });
    
    const individualAwards = data['H2个人奖'] || [];
    individualAwards.forEach(award => {
      if (award.winner_name) {
        const matchName = award.winner_name.toLowerCase().includes(searchTerm);
        const matchDept = award.department?.toLowerCase().includes(searchTerm);
        
        if (matchName || matchDept) {
          results.push({
            type: 'Individual Award',
            level: `Regional - ${region.toUpperCase()}`,
            name: award.winner_name,
            award: award.team_award,
            department: award.department
          });
        }
      }
    });
  });
  
  if (searchData.rankings) {
    const rankings = searchData.rankings.top10 || [];
    rankings.forEach(r => {
      if (r.name?.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'Top Performer',
          level: `Rank #${r.rank}`,
          name: r.name,
          points: r.points,
          department: r.department || r.region || 'TikTok Shop'
        });
      }
    });
  }
  
  return results;
}

function renderSearchResults(results, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (results.length === 0) {
    container.innerHTML = '<div class="no-results">No results found</div>';
    return;
  }
  
  let html = '';
  results.slice(0, 20).forEach(result => {
    html += `
      <div class="search-result-item">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <span style="background: var(--primary-color); padding: 2px 8px; border-radius: 4px; font-size: 12px;">
            ${result.type}
          </span>
          <span style="color: var(--text-secondary); font-size: 12px;">${result.level}</span>
          ${result.period ? `<span style="color: var(--accent-color); font-size: 11px;">${result.period}</span>` : ''}
        </div>
        <div style="font-weight: 600; margin-bottom: 4px;">${result.name}</div>
        <div style="color: var(--accent-color); font-size: 14px;">${result.award || (result.points ? result.points + ' pts' : '')}</div>
        ${result.department ? `<div style="color: var(--text-secondary); font-size: 12px;">${result.department}</div>` : ''}
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ==================== Initialize ====================
const isHomePage = document.getElementById('top3-podium');
const isSearchPage = document.getElementById('search-input');

if (isHomePage) {
  console.log('Home page detected - using page-specific initialization');
} else if (isSearchPage) {
  document.addEventListener('DOMContentLoaded', () => {
    highlightNavigation();
    initYearNavigation();
    initRegionNavigation();
    initDeptNavigation();
    initSearch();
    
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const query = searchInput?.value || '';
        const results = performSearch(query);
        renderSearchResults(results, 'search-results');
        document.getElementById('search-results')?.classList.add('active');
      });
    }
    
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const query = e.target.value || '';
          const results = performSearch(query);
          renderSearchResults(results, 'search-results');
          document.getElementById('search-results')?.classList.add('active');
        }
      });
    }
  });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    highlightNavigation();
    initYearNavigation();
    initRegionNavigation();
    initDeptNavigation();
  });
}
