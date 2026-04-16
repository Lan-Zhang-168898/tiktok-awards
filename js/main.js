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
  currentDept: null
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

// ==================== Ranking Functions ====================
function calculateRegionTop3(regionData, region) {
  if (!regionData) return [];
  
  const awards = regionData['H1项目奖'] || regionData['H2项目奖'] || [];
  const individualAwards = regionData['H2个人奖'] || [];
  
  // Calculate member scores for projects
  const memberScores = {};
  
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
          department: award.department || region
        };
      }
      memberScores[key].score += 3; // Regional = 3 points
      memberScores[key].awards += 1;
    });
  });
  
  // Add individual awards
  individualAwards.forEach(award => {
    const key = award.winner_name;
    if (!memberScores[key]) {
      memberScores[key] = {
        name: award.winner_name,
        score: 0,
        awards: 0,
        email: award.email || '',
        department: award.department || region
      };
    }
    memberScores[key].score += 3;
    memberScores[key].awards += 1;
  });
  
  // Sort and get top 3
  return Object.values(memberScores)
    .sort((a, b) => b.score - a.score || b.awards - a.awards)
    .slice(0, 3);
}

function calculateGlobalTop3(globalData) {
  if (!globalData) return [];
  
  const awards = globalData['H1项目奖'] || globalData['H2项目奖'] || [];
  
  const memberScores = {};
  
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
          department: award.department || 'Global'
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

// ==================== Render Functions ====================
function renderPodium(top3, containerId, title) {
  const container = document.getElementById(containerId);
  if (!container || top3.length === 0) return;
  
  let html = `
    <div class="podium">
      ${top3[1] ? `
        <div class="podium-item second">
          <div class="podium-medal">🥈</div>
          <div class="podium-rank">#2</div>
          <div class="podium-name">${top3[1].name}</div>
          <div class="podium-dept">${top3[1].department || top3[1].region || 'TikTok Shop'}</div>
          <div class="podium-score">${top3[1].score || top3[1].points} pts</div>
        </div>
      ` : ''}
      ${top3[0] ? `
        <div class="podium-item first">
          <div class="podium-medal">🥇</div>
          <div class="podium-rank">#1</div>
          <div class="podium-name">${top3[0].name}</div>
          <div class="podium-dept">${top3[0].department || top3[0].region || 'TikTok Shop'}</div>
          <div class="podium-score">${top3[0].score || top3[0].points} pts</div>
        </div>
      ` : ''}
      ${top3[2] ? `
        <div class="podium-item third">
          <div class="podium-medal">🥉</div>
          <div class="podium-rank">#3</div>
          <div class="podium-name">${top3[2].name}</div>
          <div class="podium-dept">${top3[2].department || top3[2].region || 'TikTok Shop'}</div>
          <div class="podium-score">${top3[2].score || top3[2].points} pts</div>
        </div>
      ` : ''}
    </div>
  `;
  
  container.innerHTML = html;
}

function renderRankingList(rankings, startRank = 4, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !rankings || rankings.length < startRank) return;
  
  let html = '<div class="ranking-list">';
  
  for (let i = startRank - 1; i < Math.min(rankings.length, 10); i++) {
    const r = rankings[i];
    html += `
      <div class="ranking-item">
        <span class="ranking-rank">#${r.rank || i + 1}</span>
        <span class="ranking-name">${r.name}</span>
        <span class="ranking-dept">${r.department || r.region || ''}</span>
        <span class="ranking-score">${r.points || r.score || 0} pts</span>
      </div>
    `;
  }
  
  html += '</div>';
  container.innerHTML = html;
}

function renderGlobalAwards(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !data) return;
  
  const awards = data['H1项目奖'] || [];
  
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
        period: award.period
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
    html += `
      <div class="card project-card">
        <div class="card-header">
          <span class="card-icon">📦</span>
          <span class="card-title">${project.project_name}</span>
        </div>
        <div class="card-body">
          <div class="card-award">
            <span class="card-award-name">🏆 ${project.team_award || 'Award'}</span>
          </div>
          <div class="card-amount">${formatCurrency(project.bonus)}</div>
          <div class="card-reason" onclick="this.classList.toggle('expanded')">
            ${project.reason}
          </div>
        </div>
        <div class="card-footer">
          <button class="members-btn" onclick="showMembersModal('${project.project_name}', ${JSON.stringify(project.members).replace(/"/g, '&quot;')})">
            Team Members (${project.members.length})
          </button>
          <div class="card-actions">
            <span class="action-btn">❤️ 0</span>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function renderRegionalAwards(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !data) return;
  
  const awards = data['H1项目奖'] || [];
  const individualAwards = data['H2个人奖'] || [];
  
  // Group projects
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
        region: award.region,
        period: award.period
      };
    }
    award.members.forEach(m => {
      if (!projectGroups[key].members.find(mem => mem.name === m)) {
        projectGroups[key].members.push({ name: m, email: award.email });
      }
    });
  });
  
  let html = '<div class="awards-grid">';
  
  // Project awards
  Object.values(projectGroups).forEach(project => {
    html += `
      <div class="card project-card">
        <div class="card-header">
          <span class="card-icon">📦</span>
          <span class="card-title">${project.project_name}</span>
        </div>
        <div class="card-body">
          <div class="card-award">
            <span class="card-award-name">🏆 ${project.team_award || 'Award'}</span>
          </div>
          <div class="card-amount">${formatCurrency(project.bonus)}</div>
          <div class="card-reason" onclick="this.classList.toggle('expanded')">
            ${project.reason}
          </div>
        </div>
        <div class="card-footer">
          <button class="members-btn" onclick="showMembersModal('${project.project_name}', ${JSON.stringify(project.members).replace(/"/g, '&quot;')})">
            Team Members (${project.members.length})
          </button>
          <div class="card-actions">
            <span class="action-btn">❤️ 0</span>
          </div>
        </div>
      </div>
    `;
  });
  
  // Individual awards
  individualAwards.forEach(award => {
    html += `
      <div class="card individual-card">
        <div class="card-header">
          <span class="card-icon">👤</span>
          <span class="card-title">${award.winner_name} | ${award.department || award.region}</span>
        </div>
        <div class="card-body">
          <div class="card-award">
            <span class="card-award-name">🌟 ${award.team_award || 'Stellar Contributor'}</span>
          </div>
          <div class="card-amount">${formatCurrency(award.bonus)}</div>
          <div class="card-reason" onclick="this.classList.toggle('expanded')">
            ${award.reason || ''}
          </div>
        </div>
        <div class="card-footer">
          <div class="card-actions">
            <span class="action-btn">❤️ 0</span>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function renderOverviewStats(rankings) {
  const container = document.getElementById('overview-stats');
  if (!container || !rankings) return;
  
  const totalEmployees = rankings.total_employees || 0;
  const totalGlobal = rankings.total_global_awards || 0;
  const totalRegional = rankings.total_regional_awards || 0;
  const totalAwards = totalGlobal + totalRegional;
  
  // Calculate total bonus
  let totalBonus = 0;
  if (AppData.global) {
    const globalAwards = AppData.global['H1项目奖'] || [];
    globalAwards.forEach(a => {
      if (a.bonus) totalBonus += Number(a.bonus);
    });
  }
  
  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div class="stat-value">${totalAwards}</div>
        <div class="stat-label">Total Awards</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-value">${totalEmployees}</div>
        <div class="stat-label">Award Winners</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🌍</div>
        <div class="stat-value">${totalGlobal}</div>
        <div class="stat-label">Global Awards</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🌏</div>
        <div class="stat-value">${totalRegional}</div>
        <div class="stat-label">Regional Awards</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-value">${formatCurrency(totalBonus)}</div>
        <div class="stat-label">Total Bonus Pool</div>
      </div>
    </div>
  `;
}

// ==================== Modal Functions ====================
function showMembersModal(projectName, members) {
  const modal = document.getElementById('members-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  
  if (!modal) return;
  
  modalTitle.textContent = projectName;
  
  let membersHtml = '';
  members.forEach(member => {
    membersHtml += `
      <div class="member-item">
        <div class="member-name">${member.name}</div>
        <div class="member-email">${member.email || ''}</div>
      </div>
    `;
  });
  
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
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// ==================== Search Functions ====================
let searchData = null;

async function initSearch() {
  try {
    // Load all data for search
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
  
  // Search in Global awards
  if (searchData.global) {
    const awards = searchData.global['H1项目奖'] || [];
    awards.forEach(award => {
      const matchName = award.project_name?.toLowerCase().includes(searchTerm);
      const matchMember = award.members?.some(m => m.toLowerCase().includes(searchTerm));
      const matchDept = award.department?.toLowerCase().includes(searchTerm);
      const matchReason = award.reason?.toLowerCase().includes(searchTerm);
      
      if (matchName || matchMember || matchDept || matchReason) {
        results.push({
          type: 'Project Award',
          level: 'Global',
          name: award.project_name,
          award: award.team_award,
          members: award.members,
          department: award.department,
          reason: award.reason
        });
      }
    });
  }
  
  // Search in Regional awards
  ['us', 'eu', 'sea', 'latam'].forEach(region => {
    const data = searchData.regional[region];
    if (!data) return;
    
    const awards = data['H1项目奖'] || [];
    awards.forEach(award => {
      const matchName = award.project_name?.toLowerCase().includes(searchTerm);
      const matchMember = award.members?.some(m => m.toLowerCase().includes(searchTerm));
      const matchDept = award.department?.toLowerCase().includes(searchTerm);
      
      if (matchName || matchMember || matchDept) {
        results.push({
          type: 'Project Award',
          level: `Regional - ${region.toUpperCase()}`,
          name: award.project_name,
          award: award.team_award,
          members: award.members,
          department: award.department
        });
      }
    });
    
    const individualAwards = data['H2个人奖'] || [];
    individualAwards.forEach(award => {
      const matchName = award.winner_name?.toLowerCase().includes(searchTerm);
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
    });
  });
  
  // Search in Rankings
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
        </div>
        <div style="font-weight: 600; margin-bottom: 4px;">${result.name}</div>
        <div style="color: var(--accent-color); font-size: 14px;">${result.award || result.points + ' pts'}</div>
        ${result.department ? `<div style="color: var(--text-secondary); font-size: 12px;">${result.department}</div>` : ''}
      </div>
    `;
  });
  
  container.innerHTML = html;
}

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', () => {
  highlightNavigation();
  initYearNavigation();
  initRegionNavigation();
  initDeptNavigation();
  initSearch();
  
  // Setup search handlers
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
