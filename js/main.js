// TikTok Shop Stars Awards - Main JavaScript

// ==================== Global Data Store ====================
const AppData = {
  global: null,
  regional: {
    us: null,
    eu: null,
    sea: null,
    latam: null,
    fs: null
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

function formatCurrency(amount, currency = 'USD') {
  if (!amount) return 'TBD';
  
  const symbol = currency === 'CNY' ? '¥' : '$';
  return symbol + Number(amount).toLocaleString();
}

function formatBonus(amount, currency = 'USD') {
  if (!amount || amount === 0) return 'TBD';
  const symbol = currency === 'CNY' ? '¥' : '$';
  if (amount >= 1000000) {
    return symbol + (amount / 1000000).toFixed(1) + 'M';
  }
  if (amount >= 1000) {
    return symbol + (amount / 1000).toFixed(0) + 'K';
  }
  return symbol + amount;
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

// 更新2026年份按钮的Coming Soon标签
function updateYear2026Button() {
  const year2026Btn = document.getElementById('year-2026-btn');
  if (!year2026Btn) return;
  
  const page = window.location.pathname.split('/').pop();
  
  // HomePage和Regional页面（LATAM区域）：2026按钮可点击，不显示Coming Soon
  if (page === 'index.html' || page === '' || page === '/') {
    // HomePage：2026年有LATAM数据，所以可以点击
    year2026Btn.innerHTML = '2026';
    return;
  }
  
  // Global页面：始终显示Coming Soon
  if (page === 'global.html') {
    year2026Btn.innerHTML = '2026 <span class="coming-soon-tag" style="opacity: 0.6;">· Coming Soon</span>';
    return;
  }
  
  // Regional页面：只有LATAM区域不显示Coming Soon
  if (page === 'regional.html') {
    if (AppData.currentRegion === 'latam') {
      year2026Btn.innerHTML = '2026';
    } else {
      year2026Btn.innerHTML = '2026 <span class="coming-soon-tag" style="opacity: 0.6;">· Coming Soon</span>';
    }
    return;
  }
  
  // Departmental页面：始终显示Coming Soon
  if (page === 'departmental.html') {
    year2026Btn.innerHTML = '2026 <span class="coming-soon-tag" style="opacity: 0.6;">· Coming Soon</span>';
    return;
  }
}

function initYearNavigation() {
  const yearBtns = document.querySelectorAll('.year-btn');
  const urlYear = getUrlParam('year') || '2025';
  
  AppData.currentYear = urlYear;
  
  // 初始化时更新2026按钮状态
  updateYear2026Button();
  
  yearBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.year === urlYear) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => {
      const page = window.location.pathname.split('/').pop();
      
      // Global 和 Departmental 页面不允许选择 2026
      if ((page === 'global.html' || page === 'departmental.html') && btn.dataset.year === '2026') {
        alert('2026 data is not available yet. Coming soon!');
        return;
      }
      
      // Regional 和 HomePage：允许切换年份
      // Regional页面会根据年份显示不同区域的状态
      const baseUrl = window.location.href.split('?')[0].replace(/\/[^\/]*$/, '/');
      const currentRegion = getUrlParam('region');
      const regionParam = currentRegion ? `&region=${currentRegion}` : '';
      const currentQuarter = getUrlParam('quarter');
      const quarterParam = currentQuarter ? `&quarter=${currentQuarter}` : '';
      window.location.href = `${baseUrl}${page}?year=${btn.dataset.year}${regionParam}${quarterParam}`;
    });
  });
}

function initRegionNavigation() {
  const regionBtns = document.querySelectorAll('.region-btn');
  const urlRegion = getUrlParam('region') || 'us';
  
  AppData.currentRegion = urlRegion;
  
  // 初始化时更新2026按钮状态
  updateYear2026Button();
  
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
  // Support both .dept-btn (legacy) and .region-btn (new) with data-dept attribute
  const deptBtns = document.querySelectorAll('.dept-btn, .region-btn[data-dept]');
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
      const quarter = getUrlParam('quarter') || 'Q1';
      window.location.href = `${baseUrl}${page}?year=${AppData.currentYear}&dept=${btn.dataset.dept}&quarter=${quarter}`;
    });
  });
}

// ==================== Data Loading Functions ====================
async function loadData(level, region = null, year = null) {
  try {
    let dataFile;
    
    if (level === 'global') {
      dataFile = 'data/global.json';
    } else if (level === 'regional' && region) {
      dataFile = `data/${region}.json`;
    } else if (level === 'fs') {
      dataFile = 'data/fs.json';
    } else if (level === 'pop') {
      dataFile = 'data/pop.json';
    }
    
    const response = await fetch(dataFile);
    if (!response.ok) throw new Error(`Failed to load ${dataFile}`);
    
    const data = await response.json();
    
    // 根据年份筛选数据
    const targetYear = year || AppData.currentYear || '2025';
    
    // 检查数据是否是多年份结构
    const hasYearStructure = data['2025'] || data['2026'];
    
    // ========== 数据年份规则（重要！）==========
    // - FS/POP: 只有2025年数据，无年份结构，2026年返回null
    // - US/EU/SEA/LATAM/Global: 有多年份结构（2025/2026），按年份返回对应数据
    // - 没有年份结构的数据文件：视为2025年数据，2026年返回null
    // ==========================================
    
    if (level === 'fs') {
      // FS数据只有2025年，无年份结构
      if (targetYear === '2025') {
        AppData.regional.fs = data;
        return data;
      } else {
        return null;
      }
    }
    if (level === 'pop') {
      // POP数据只有2025年，无年份结构
      if (targetYear === '2025') {
        AppData.regional.pop = data;
        return data;
      } else {
        return null;
      }
    }
    
    if (hasYearStructure) {
      // 多年份数据结构：返回对应年份数据
      if (data[targetYear]) {
        const yearData = data[targetYear];
        if (level === 'global') {
          AppData.global = yearData;
        } else if (level === 'regional') {
          AppData.regional[region] = yearData;
        }
        return yearData;
      } else {
        // 请求的年份不存在，返回null
        return null;
      }
    } else {
      // 非多年份结构：直接返回数据（假设是2025年数据）
      // 只有2025年时才返回数据，2026年返回null
      if (targetYear === '2025') {
        if (level === 'global') {
          AppData.global = data;
        } else if (level === 'regional') {
          AppData.regional[region] = data;
        }
        return data;
      } else {
        return null;
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
}

async function loadRankings(year = null) {
  try {
    const response = await fetch('data/rankings.json');
    if (!response.ok) throw new Error('Failed to load rankings');
    
    const data = await response.json();
    AppData.rankings = data;
    
    // 如果指定了年份，返回该年份的数据
    if (year && data[year]) {
      return data[year];
    }
    
    // 否则返回当前年份的数据
    const currentYear = AppData.currentYear || '2025';
    return data[currentYear] || data['2025'];
  } catch (error) {
    console.error('Error loading rankings:', error);
    return null;
  }
}

// ==================== Helper Functions for Quarterly Data (Q1/Q2/Q3/Q4) ====================

// Get Q1 project awards
function getQ1ProjectAwards(data) {
  if (!data) return [];
  // Support both quarterly (Q1项目奖) and legacy (H1项目奖) structure
  if (data['Q1项目奖']) {
    return data['Q1项目奖'];
  }
  // Legacy: H1项目奖中quarter为Q1的
  const h1Awards = data['H1项目奖'] || [];
  return h1Awards.filter(a => a.quarter === 'Q1' || a.period === 'Q1');
}

// Get Q2 project awards
function getQ2ProjectAwards(data) {
  if (!data) return [];
  if (data['Q2项目奖']) {
    return data['Q2项目奖'];
  }
  const h1Awards = data['H1项目奖'] || [];
  return h1Awards.filter(a => a.quarter === 'Q2' || a.period === 'Q2');
}

// Get Q3 project awards
function getQ3ProjectAwards(data) {
  if (!data) return [];
  if (data['Q3项目奖']) {
    return data['Q3项目奖'];
  }
  const h2Awards = data['H2项目奖'] || [];
  return h2Awards.filter(a => a.quarter === 'Q3' || a.period === 'Q3');
}

// Get Q4 project awards
function getQ4ProjectAwards(data) {
  if (!data) return [];
  if (data['Q4项目奖']) {
    return data['Q4项目奖'];
  }
  const h2Awards = data['H2项目奖'] || [];
  return h2Awards.filter(a => a.quarter === 'Q4' || a.period === 'Q4');
}

// Legacy support: Get H1 project awards (Q1 + Q2)
function getH1ProjectAwards(data) {
  if (!data) return [];
  if (data['H1项目奖']) {
    return data['H1项目奖'];
  }
  return [...getQ1ProjectAwards(data), ...getQ2ProjectAwards(data)];
}

// Legacy support: Get H2 project awards (Q3 + Q4)
function getH2ProjectAwards(data) {
  if (!data) return [];
  if (data['H2项目奖']) {
    return data['H2项目奖'];
  }
  return [...getQ3ProjectAwards(data), ...getQ4ProjectAwards(data)];
}

// Combine all project awards into single array
function getAllProjectAwards(data) {
  if (!data) return [];
  return [...getQ1ProjectAwards(data), ...getQ2ProjectAwards(data), ...getQ3ProjectAwards(data), ...getQ4ProjectAwards(data)];
}

// Get all individual awards
function getAllIndividualAwards(data) {
  if (!data) return [];
  return data['H2个人奖'] || [];
}

// Get individual awards by quarter (for LATAM)
function getIndividualAwardsByQuarter(data, quarter) {
  if (!data) return [];
  // Support both legacy and year-based structure
  const currentYear = AppData.currentYear || '2025';
  if (hasYearStructure(data)) {
    const yearData = data[currentYear];
    if (!yearData) return [];
    const allIndividual = yearData['H2个人奖'] || [];
    return allIndividual.filter(a => a.quarter === quarter || a.period === quarter);
  }
  const allIndividual = data['H2个人奖'] || [];
  return allIndividual.filter(a => a.quarter === quarter || a.period === quarter);
}

// ==================== Helper Functions for Year-based Data Structure ====================

// Check if data uses year-based structure (LATAM 2026+)
function hasYearStructure(data) {
  if (!data) return false;
  // Year-based structure has keys like "2025", "2026" which are numeric strings
  return Object.keys(data).some(key => /^\d{4}$/.test(key));
}

// Get data for specific year
function getYearData(data, year) {
  if (!data) return null;
  if (hasYearStructure(data)) {
    return data[year] || null;
  }
  // Quarterly structure - return entire data
  return data;
}

// Get Q1 project awards (year-based structure)
function getQ1ProjectAwardsYear(data, year) {
  const yearData = getYearData(data, year);
  if (!yearData) return [];
  if (yearData['Q1项目奖']) return yearData['Q1项目奖'];
  const h1Awards = yearData['H1项目奖'] || [];
  return h1Awards.filter(a => a.quarter === 'Q1' || a.period === 'Q1');
}

// Get Q2 project awards (year-based structure)
function getQ2ProjectAwardsYear(data, year) {
  const yearData = getYearData(data, year);
  if (!yearData) return [];
  if (yearData['Q2项目奖']) return yearData['Q2项目奖'];
  const h1Awards = yearData['H1项目奖'] || [];
  return h1Awards.filter(a => a.quarter === 'Q2' || a.period === 'Q2');
}

// Get Q3 project awards (year-based structure)
function getQ3ProjectAwardsYear(data, year) {
  const yearData = getYearData(data, year);
  if (!yearData) return [];
  if (yearData['Q3项目奖']) return yearData['Q3项目奖'];
  const h2Awards = yearData['H2项目奖'] || [];
  return h2Awards.filter(a => a.quarter === 'Q3' || a.period === 'Q3');
}

// Get Q4 project awards (year-based structure)
function getQ4ProjectAwardsYear(data, year) {
  const yearData = getYearData(data, year);
  if (!yearData) return [];
  if (yearData['Q4项目奖']) return yearData['Q4项目奖'];
  const h2Awards = yearData['H2项目奖'] || [];
  return h2Awards.filter(a => a.quarter === 'Q4' || a.period === 'Q4');
}

// Legacy support: Get H1 project awards (year-based structure)
function getH1ProjectAwardsYear(data, year) {
  const yearData = getYearData(data, year);
  if (!yearData) return [];
  if (yearData['H1项目奖']) return yearData['H1项目奖'];
  return [...getQ1ProjectAwardsYear(data, year), ...getQ2ProjectAwardsYear(data, year)];
}

// Legacy support: Get H2 project awards (year-based structure)
function getH2ProjectAwardsYear(data, year) {
  const yearData = getYearData(data, year);
  if (!yearData) return [];
  if (yearData['H2项目奖']) return yearData['H2项目奖'];
  return [...getQ3ProjectAwardsYear(data, year), ...getQ4ProjectAwardsYear(data, year)];
}

// Get H1 individual awards (year-based structure, for LATAM 2026)
function getQ1IndividualAwardsYear(data, year) {
  const yearData = getYearData(data, year);
  if (!yearData) return [];
  return yearData['Q1个人奖'] || [];
}

// Get H2 individual awards (year-based structure)
function getH2IndividualAwardsYear(data, year) {
  const yearData = getYearData(data, year);
  if (!yearData) return [];
  return yearData['H2个人奖'] || [];
}

// Get LATAM individual awards by year and period
function getLatamIndividualAwards(data, year, period) {
  const yearData = getYearData(data, year);
  if (!yearData) return [];
  
  if (period === 'Q1个人奖') {
    return yearData['Q1个人奖'] || [];
  } else if (period === 'H2个人奖') {
    return yearData['H2个人奖'] || [];
  }
  return [];
}

// Get available award periods for LATAM by year
function getAvailableLatamPeriods(data, year) {
  const yearData = getYearData(data, year);
  if (!yearData) return [];
  
  const periods = [];
  if (yearData['Q1个人奖'] && yearData['Q1个人奖'].length > 0) {
    periods.push('Q1个人奖');
  }
  if (yearData['H2个人奖'] && yearData['H2个人奖'].length > 0) {
    periods.push('H2个人奖');
  }
  if (yearData['H1项目奖'] && yearData['H1项目奖'].length > 0) {
    periods.push('H1项目奖');
  }
  if (yearData['H2项目奖'] && yearData['H2项目奖'].length > 0) {
    periods.push('H2项目奖');
  }
  return periods;
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
  const currentYear = AppData.currentYear || '2025';
  
  const getSafeDept = (dept, reg, defaultVal) => {
    if (dept && dept !== 'undefined' && dept !== 'null' && dept !== '') return dept;
    if (reg && reg !== 'undefined' && reg !== 'null' && reg !== '') return reg;
    return defaultVal || 'Regional';
  };
  
  // Include ALL award types for full year ranking (using year-aware functions)
  const h1Awards = getH1ProjectAwardsYear(regionData, currentYear);
  const h2Awards = getH2ProjectAwardsYear(regionData, currentYear);
  
  // For LATAM, combine all quarters or Q1个人奖 based on year
  let allIndividualAwards = [];
  if (region === 'latam') {
    if (currentYear === '2026') {
      // 2026: use Q1个人奖
      allIndividualAwards = getQ1IndividualAwardsYear(regionData, currentYear);
    } else {
      // 2025: use Q1-Q4 quarters
      allIndividualAwards = getIndividualAwardsByQuarter(regionData, 'Q1').concat(
        getIndividualAwardsByQuarter(regionData, 'Q2'),
        getIndividualAwardsByQuarter(regionData, 'Q3'),
        getIndividualAwardsByQuarter(regionData, 'Q4')
      );
    }
  } else {
    allIndividualAwards = getH2IndividualAwardsYear(regionData, currentYear);
  }
  
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
  const currentYear = AppData.currentYear || '2025';
  
  // Q1/Q2/Q3/Q4: 区分 FS/POP (项目奖) 和 LATAM (个人奖)
  if (['Q1', 'Q2', 'Q3', 'Q4'].includes(period)) {
    const isQuarterProjectRegion = region === 'fs' || region === 'pop';
    
    if (isQuarterProjectRegion) {
      // FS/POP: 显示季度项目奖
      const quarterKey = `${period}项目奖`;
      const quarterAwards = data[quarterKey] || [];
      if (quarterAwards.length === 0) {
        html = `<div class="no-data-msg">No ${period} project awards available</div>`;
      } else {
        html = renderProjectCards(quarterAwards, region, period);
      }
    } else {
      // LATAM: 显示季度个人奖
      const quarterAwards = getIndividualAwardsByQuarter(data, period);
      if (quarterAwards.length === 0) {
        html = `<div class="no-data-msg">No ${period} individual awards available for LATAM</div>`;
      } else {
        html = renderIndividualCards(quarterAwards, region, period);
      }
    }
  } else if (period === 'Q4个人奖') {
    // FS/POP Q4 BFCM个人奖 (H2个人奖)
    const individualAwards = data['H2个人奖'] || [];
    if (individualAwards.length === 0) {
      html = '<div class="no-data-msg">No Q4 BFCM Stellar Contributors available</div>';
    } else {
      html = renderIndividualCards(individualAwards, region, 'Q4 BFCM');
    }
  } else if (period === 'Q1个人奖') {
    // LATAM H1 individual awards (2026)
    const h1Awards = getQ1IndividualAwardsYear(data, currentYear);
    if (h1Awards.length === 0) {
      html = `<div class="no-data-msg">No H1 individual awards available for LATAM ${currentYear}</div>`;
    } else {
      html = renderIndividualCards(h1Awards, region, 'H1');
    }
  } else if (period === 'H1项目奖') {
    const h1Awards = getH1ProjectAwardsYear(data, currentYear);
    if (h1Awards.length === 0) {
      html = '<div class="no-data-msg">No H1 project awards available for this region</div>';
    } else {
      html = renderProjectCards(h1Awards, region, 'H1');
    }
  } else if (period === 'H2项目奖') {
    const h2Awards = getH2ProjectAwardsYear(data, currentYear);
    if (h2Awards.length === 0) {
      html = '<div class="no-data-msg">No H2 project awards available for this region</div>';
    } else {
      html = renderProjectCards(h2Awards, region, 'H2');
    }
  } else if (period === 'H2个人奖') {
    // Non-LATAM individual awards or LATAM 2025 H2 individual
    const individualAwards = getH2IndividualAwardsYear(data, currentYear);
    if (individualAwards.length === 0) {
      html = '<div class="no-data-msg">No individual awards (Stellar Contributors) available for this region</div>';
    } else {
      html = renderIndividualCards(individualAwards, region, 'H2');
    }
  }
  
  container.innerHTML = html;
}

function renderProjectCards(awards, region, half) {
  // FS/POP 使用人民币，其他区域使用美元
  const defaultCurrency = (region === 'fs' || region === 'pop') ? 'CNY' : 'USD';
  
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
        currency: award.currency || defaultCurrency
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
          <div class="card-amount">${formatCurrency(project.bonus, project.currency)}</div>
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
  // FS/POP 使用人民币，其他区域使用美元
  const defaultCurrency = (region === 'fs' || region === 'pop') ? 'CNY' : 'USD';
  
  let html = '<div class="awards-grid">';
  
  awards.forEach(award => {
    // Handle both winner_name and members array formats
    const memberNames = award.members || (award.winner_name ? [award.winner_name] : []);
    const currency = award.currency || defaultCurrency;
    
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
            <div class="card-amount">${formatCurrency(award.bonus, currency)}</div>
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
// 重构后的搜索系统：支持按页面层级过滤、项目去重、精确匹配优先

let searchData = null;
let currentPageLevel = 'home'; // 'home' | 'global' | 'regional' | 'departmental'
let currentSearchRegion = null; // 当前区域（用于regional页面）

// ========== 数据解析辅助函数 ==========

/**
 * 获取数据中指定年份的数据
 * @param {Object} data - 原始数据
 * @param {string} year - 年份
 * @returns {Object|null} - 指定年份的数据
 */
function getDataForYear(data, year) {
  if (!data) return null;
  const targetYear = year || AppData.currentYear || '2025';
  // 检查是否有年份结构（如 { "2025": {...}, "2026": {...} }）
  if (data[targetYear]) {
    return data[targetYear];
  }
  // 如果数据直接在顶层（无年份结构），直接返回
  // 对于FS/POP等无年份结构的数据，直接返回
  if (typeof data['H1项目奖'] !== 'undefined' || typeof data['Q1个人奖'] !== 'undefined') {
    return data;
  }
  return null;
}

/**
 * 从award数组中提取所有成员（去重）
 */
function extractUniqueMembers(awards) {
  const membersMap = {};
  awards.forEach(award => {
    if (award.members && Array.isArray(award.members)) {
      award.members.forEach(member => {
        const memberName = typeof member === 'string' ? member : member.name;
        if (memberName && !membersMap[memberName]) {
          membersMap[memberName] = {
            name: memberName,
            email: award.email || (typeof member === 'object' ? member.email : '')
          };
        }
      });
    }
  });
  return Object.values(membersMap);
}

// ========== 搜索匹配函数 ==========

/**
 * 计算搜索词与目标字符串的匹配度
 * @param {string} searchTerm - 搜索词（小写）
 * @param {string} target - 目标字符串（小写）
 * @returns {number} - 匹配度分数：0=不匹配, 1=包含匹配, 2=前缀匹配, 3=精确匹配
 */
function calculateMatchScore(searchTerm, target) {
  if (!target || !searchTerm) return 0;
  const targetLower = target.toLowerCase();
  const termLower = searchTerm.toLowerCase();
  
  // 精确匹配（完全相等）
  if (targetLower === termLower) return 3;
  // 前缀匹配（目标以搜索词开头）
  if (targetLower.startsWith(termLower)) return 2;
  // 包含匹配（目标包含搜索词）
  if (targetLower.includes(termLower)) return 1;
  return 0;
}

/**
 * 判断搜索词是否是区域关键词
 */
function isRegionKeyword(term) {
  const regionKeywords = ['us', 'eu', 'sea', 'latam', 'fs', 'pop', 'americas', 'emea', 'apac'];
  return regionKeywords.includes(term.toLowerCase());
}

/**
 * 判断是否应该优先匹配region字段
 */
function shouldMatchRegion(searchTerm, targetField) {
  const searchLower = searchTerm.toLowerCase();
  // 如果搜索词是区域名，优先匹配region/level字段
  if (isRegionKeyword(searchLower)) {
    return targetField === 'region' || targetField === 'level';
  }
  return false;
}

// ========== 项目去重与合并 ==========

/**
 * 对项目奖项进行去重和成员合并
 * @param {Array} awards - 项目奖项数组
 * @param {string} levelType - 层级类型：'global', 'regional-us'等
 * @returns {Array} - 去重后的项目列表
 */
function deduplicateProjects(awards, levelType) {
  const projectMap = {};
  
  awards.forEach(award => {
    // 创建唯一键：project_name + team_award
    const key = `${award.project_name}||${award.team_award || ''}`;
    
    if (!projectMap[key]) {
      projectMap[key] = {
        project_name: award.project_name,
        project_english_name: award.project_english_name,
        team_award: award.team_award,
        bonus: award.bonus,
        currency: award.currency,
        reason: award.reason,
        department: award.department,
        region: award.region,
        level: levelType,
        members: [],
        period: award.period || award.award_type,
        award_type: award.award_type
      };
    }
    
    // 合并成员（去重）
    if (award.members && Array.isArray(award.members)) {
      award.members.forEach(member => {
        const memberName = typeof member === 'string' ? member : member.name;
        const memberEmail = typeof member === 'object' ? member.email : award.email;
        if (memberName && !projectMap[key].members.find(m => m.name === memberName)) {
          projectMap[key].members.push({
            name: memberName,
            email: memberEmail || ''
          });
        }
      });
    }
  });
  
  return Object.values(projectMap);
}

// ========== 搜索初始化 ==========

async function initSearch() {
  try {
    const targetYear = AppData.currentYear || '2025';
    
    // 并行加载所有数据
    const [global, us, eu, sea, latam, fs, pop, rankings] = await Promise.all([
      fetch('data/global.json').then(r => r.json()).catch(() => null),
      fetch('data/us.json').then(r => r.json()).catch(() => null),
      fetch('data/eu.json').then(r => r.json()).catch(() => null),
      fetch('data/sea.json').then(r => r.json()).catch(() => null),
      fetch('data/latam.json').then(r => r.json()).catch(() => null),
      fetch('data/fs.json').then(r => r.json()).catch(() => null),
      fetch('data/pop.json').then(r => r.json()).catch(() => null),
      fetch('data/rankings.json').then(r => r.json()).catch(() => null)
    ]);
    
    // 根据年份解析数据
    searchData = {
      global: getDataForYear(global, targetYear),
      regional: {
        us: getDataForYear(us, targetYear),
        eu: getDataForYear(eu, targetYear),
        sea: getDataForYear(sea, targetYear),
        latam: getDataForYear(latam, targetYear),
        fs: getDataForYear(fs, targetYear),
        pop: getDataForYear(pop, targetYear)
      },
      rankings: rankings,
      rawData: { global, us, eu, sea, latam, fs, pop, rankings } // 保留原始数据用于某些场景
    };
    
    console.log('Search initialized for year:', targetYear);
  } catch (error) {
    console.error('Error initializing search:', error);
  }
}

/**
 * 设置当前页面层级（用于搜索范围控制）
 */
function setSearchPageLevel(level, region = null) {
  currentPageLevel = level;
  currentSearchRegion = region;
}

// ========== 核心搜索函数 ==========

/**
 * 重构后的performSearch函数
 * @param {string} query - 搜索词
 * @param {string} pageLevel - 页面层级：'home'|'global'|'regional'|'departmental'
 * @param {string} currentRegion - 当前区域（用于regional页面）
 * @returns {Array} - 搜索结果数组
 */
function performSearch(query, pageLevel = null, currentRegion = null) {
  if (!query || !searchData) return [];
  
  // 确定搜索范围
  const level = pageLevel || currentPageLevel || 'home';
  const region = currentRegion || currentSearchRegion;
  
  const searchTerm = query.toLowerCase().trim();
  const results = [];
  
  // 根据页面层级决定搜索范围
  if (level === 'home') {
    // Home页：搜索所有层级
    searchGlobalProjects(results, searchTerm);
    searchRegionalProjects(results, searchTerm, null);
  } else if (level === 'global') {
    // Global页：只搜索Global数据
    searchGlobalProjects(results, searchTerm);
  } else if (level === 'regional') {
    // Regional页：只搜索当前region数据
    if (region) {
      searchRegionalProjects(results, searchTerm, region);
    }
  } else if (level === 'departmental') {
    // Departmental页：搜索departmental数据
    searchDepartmentalProjects(results, searchTerm);
  }
  
  // 搜索Top Performers（Home页显示）
  if (level === 'home' && searchData.rankings) {
    searchRankings(results, searchTerm);
  }
  
  // 按相关度排序
  sortByRelevance(results, searchTerm);
  
  // 限制返回数量
  return results.slice(0, 50);
}

/**
 * 搜索Global项目奖项
 */
function searchGlobalProjects(results, searchTerm) {
  if (!searchData.global) return;
  
  // 收集所有Global项目奖项
  const allAwards = [];
  
  // H1项目奖
  const h1Awards = searchData.global['H1项目奖'] || [];
  const h1Q1Awards = (searchData.global['Q1项目奖'] || []).concat(h1Awards.filter(a => a.period === 'Q1' || a.quarter === 'Q1'));
  const h1Q2Awards = (searchData.global['Q2项目奖'] || []).concat(h1Awards.filter(a => a.period === 'Q2' || a.quarter === 'Q2'));
  
  // H2项目奖
  const h2Awards = searchData.global['H2项目奖'] || [];
  const h2Q3Awards = (searchData.global['Q3项目奖'] || []).concat(h2Awards.filter(a => a.period === 'Q3' || a.quarter === 'Q3'));
  const h2Q4Awards = (searchData.global['Q4项目奖'] || []).concat(h2Awards.filter(a => a.period === 'Q4' || a.quarter === 'Q4'));
  
  allAwards.push(...h1Q1Awards, ...h1Q2Awards, ...h2Q3Awards, ...h2Q4Awards);
  
  // 去重
  const deduplicatedProjects = deduplicateProjects(allAwards, 'Global');
  
  // 匹配
  deduplicatedProjects.forEach(project => {
    const matchResult = matchProject(project, searchTerm);
    if (matchResult) {
      results.push({
        type: 'Project Award',
        level: 'Global',
        levelKey: 'global',
        period: project.period || 'H1/H2',
        name: project.project_name,
        project_english_name: project.project_english_name,
        award: project.team_award,
        members: project.members,
        memberCount: project.members.length,
        department: project.department,
        reason: project.reason,
        relevanceScore: matchResult.score,
        matchField: matchResult.field,
        bonus: project.bonus,
        currency: project.currency
      });
    }
  });
}

/**
 * 搜索Regional项目奖项
 */
function searchRegionalProjects(results, searchTerm, specificRegion = null) {
  const regions = specificRegion ? [specificRegion] : ['us', 'eu', 'sea', 'latam', 'fs', 'pop'];
  
  regions.forEach(region => {
    const data = searchData.regional[region];
    if (!data) return;
    
    // 收集所有项目奖项
    const allAwards = [];
    
    // H1项目奖 / Q1项目奖 / Q2项目奖
    const h1Awards = data['H1项目奖'] || [];
    allAwards.push(...(data['Q1项目奖'] || []));
    allAwards.push(...(data['Q2项目奖'] || []));
    allAwards.push(...h1Awards.filter(a => a.period === 'Q1' || a.quarter === 'Q1'));
    allAwards.push(...h1Awards.filter(a => a.period === 'Q2' || a.quarter === 'Q2'));
    
    // H2项目奖 / Q3项目奖 / Q4项目奖
    const h2Awards = data['H2项目奖'] || [];
    allAwards.push(...(data['Q3项目奖'] || []));
    allAwards.push(...(data['Q4项目奖'] || []));
    allAwards.push(...h2Awards.filter(a => a.period === 'Q3' || a.quarter === 'Q3'));
    allAwards.push(...h2Awards.filter(a => a.period === 'Q4' || a.quarter === 'Q4'));
    
    // 去重
    const levelType = `Regional - ${region.toUpperCase()}`;
    const deduplicatedProjects = deduplicateProjects(allAwards, levelType);
    
    // 匹配
    deduplicatedProjects.forEach(project => {
      const matchResult = matchProject(project, searchTerm);
      if (matchResult) {
        results.push({
          type: 'Project Award',
          level: levelType,
          levelKey: region,
          period: project.period || 'H1/H2',
          name: project.project_name,
          project_english_name: project.project_english_name,
          award: project.team_award,
          members: project.members,
          memberCount: project.members.length,
          department: project.department,
          reason: project.reason,
          relevanceScore: matchResult.score,
          matchField: matchResult.field,
          bonus: project.bonus,
          currency: project.currency
        });
      }
    });
    
    // 搜索个人奖项
    const individualAwards = data['H2个人奖'] || data['Q1个人奖'] || [];
    individualAwards.forEach(award => {
      const matchResult = matchIndividual(award, searchTerm);
      if (matchResult) {
        results.push({
          type: 'Individual Award',
          level: levelType,
          levelKey: region,
          period: award.period || award.quarter || 'H2',
          name: award.winner_name || award.members?.[0]?.name || 'Unknown',
          award: award.team_award || award.project_name || 'Stellar Contributor',
          department: award.department,
          reason: award.reason,
          relevanceScore: matchResult.score,
          matchField: matchResult.field,
          bonus: award.bonus,
          currency: award.currency,
          email: award.email
        });
      }
    });
  });
}

/**
 * 搜索Departmental项目（预留接口）
 */
function searchDepartmentalProjects(results, searchTerm) {
  // TODO: 如果有departmental.json数据，可以在这里添加搜索逻辑
  console.log('Departmental search not yet implemented');
}

/**
 * 搜索Rankings
 */
function searchRankings(results, searchTerm) {
  const rankings = searchData.rankings;
  if (!rankings) return;
  
  // 支持多年份
  const years = ['2025', '2026'];
  years.forEach(year => {
    const yearRankings = rankings[year]?.top10 || rankings[year]?.global || rankings[year]?.regional || [];
    yearRankings.forEach(r => {
      const score = calculateMatchScore(searchTerm, r.name);
      if (score > 0) {
        results.push({
          type: 'Top Performer',
          level: year,
          levelKey: 'rankings',
          name: r.name,
          award: r.points ? `${r.points} pts` : '',
          department: r.department || r.region || 'TikTok Shop',
          relevanceScore: score,
          matchField: 'name',
          rank: r.rank
        });
      }
    });
  });
}

/**
 * 匹配项目（返回匹配结果和分数）
 */
function matchProject(project, searchTerm) {
  // 精确匹配字段
  const exactFields = {
    'project_name': project.project_name,
    'project_english_name': project.project_english_name,
    'department': project.department,
    'team_award': project.team_award,
    'region': project.region
  };
  
  let bestScore = 0;
  let bestField = '';
  
  // 1. 优先精确匹配（project_name, team_award, winner_name）
  const priorityFields = ['project_name', 'project_english_name', 'team_award'];
  priorityFields.forEach(field => {
    const value = exactFields[field];
    if (value) {
      const score = calculateMatchScore(searchTerm, value);
      if (score > bestScore) {
        bestScore = score;
        bestField = field;
      }
    }
  });
  
  // 2. 如果搜索词是区域名，优先匹配region字段
  if (isRegionKeyword(searchTerm) && project.region) {
    const regionScore = calculateMatchScore(searchTerm, project.region);
    if (regionScore >= bestScore) {
      bestScore = regionScore;
      bestField = 'region';
    }
  }
  
  // 3. 成员名匹配
  if (project.members && Array.isArray(project.members)) {
    project.members.forEach(member => {
      const memberName = typeof member === 'string' ? member : member.name;
      const score = calculateMatchScore(searchTerm, memberName);
      if (score > bestScore) {
        bestScore = score;
        bestField = 'member';
      }
    });
  }
  
  // 4. 其他字段模糊匹配
  const otherFields = ['department'];
  otherFields.forEach(field => {
    const value = exactFields[field];
    if (value) {
      // 只有当分数更高时才更新
      const score = calculateMatchScore(searchTerm, value);
      if (score > bestScore) {
        bestScore = score;
        bestField = field;
      }
    }
  });
  
  // 5. 包含匹配（reason等）
  if (project.reason) {
    const reasonScore = calculateMatchScore(searchTerm, project.reason);
    // reason的权重较低
    if (reasonScore > 0 && reasonScore >= bestScore - 1) {
      bestScore = Math.max(bestScore, reasonScore);
      bestField = bestField || 'reason';
    }
  }
  
  return bestScore > 0 ? { score: bestScore, field: bestField } : null;
}

/**
 * 匹配个人奖项
 */
function matchIndividual(award, searchTerm) {
  const name = award.winner_name || (award.members?.[0]?.name || '');
  const dept = award.department || '';
  
  let bestScore = 0;
  let bestField = '';
  
  // 精确匹配姓名
  const nameScore = calculateMatchScore(searchTerm, name);
  if (nameScore > bestScore) {
    bestScore = nameScore;
    bestField = 'name';
  }
  
  // 部门匹配
  const deptScore = calculateMatchScore(searchTerm, dept);
  if (deptScore > bestScore) {
    bestScore = deptScore;
    bestField = 'department';
  }
  
  // 成员列表匹配
  if (award.members && Array.isArray(award.members)) {
    award.members.forEach(member => {
      const memberName = typeof member === 'string' ? member : member.name;
      const score = calculateMatchScore(searchTerm, memberName);
      if (score > bestScore) {
        bestScore = score;
        bestField = 'member';
      }
    });
  }
  
  return bestScore > 0 ? { score: bestScore, field: bestField } : null;
}

/**
 * 按相关度排序
 */
function sortByRelevance(results, searchTerm) {
  results.sort((a, b) => {
    // 首先按分数降序
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    // 同分数时，精确匹配优先于前缀匹配
    if (b.relevanceScore === 3 && a.relevanceScore === 3) return 0;
    // 然后按类型排序：Project Award > Individual Award > Top Performer
    const typeOrder = { 'Project Award': 0, 'Individual Award': 1, 'Top Performer': 2 };
    return (typeOrder[a.type] || 3) - (typeOrder[b.type] || 3);
  });
}

// ========== 搜索结果渲染 ==========

/**
 * 渲染搜索结果
 */
function renderSearchResults(results, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (results.length === 0) {
    container.innerHTML = '<div class="no-results" style="padding: 20px; text-align: center; color: var(--text-secondary);">No results found</div>';
    return;
  }
  
  let html = `<div class="search-results-header" style="margin-bottom: 16px; font-size: 14px; color: var(--text-secondary);">Found ${results.length} result${results.length > 1 ? 's' : ''}</div>`;
  html += '<div class="search-results-list">';
  
  results.forEach((result, index) => {
    const levelColor = getLevelColor(result.levelKey);
    const typeIcon = result.type === 'Project Award' ? '🏆' : (result.type === 'Individual Award' ? '👤' : '⭐');
    const memberText = result.memberCount ? `${result.memberCount} member${result.memberCount > 1 ? 's' : ''}` : '';
    const bonusText = result.bonus ? formatCurrency(result.bonus, result.currency) : '';
    
    html += `
      <div class="search-result-item" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s;" 
           onclick="this.classList.toggle('expanded')">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
          <span style="background: ${levelColor.bg}; color: ${levelColor.text}; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
            ${typeIcon} ${result.type}
          </span>
          <span style="background: var(--bg-dark); padding: 2px 8px; border-radius: 4px; font-size: 11px; color: var(--text-secondary);">
            ${result.level}
          </span>
          ${result.period ? `<span style="font-size: 11px; color: var(--accent-color);">${result.period}</span>` : ''}
        </div>
        <div style="font-weight: 600; font-size: 15px; margin-bottom: 4px; color: var(--text-primary);">
          ${result.project_english_name || result.name}
        </div>
        <div style="color: var(--accent-color); font-size: 13px; margin-bottom: 4px;">
          ${result.award || ''}
          ${bonusText ? `<span style="margin-left: 8px; font-size: 12px;">${bonusText}</span>` : ''}
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          ${result.department ? `<div style="color: var(--text-secondary); font-size: 12px;">📁 ${result.department}</div>` : ''}
          ${memberText ? `<div style="color: var(--text-secondary); font-size: 12px;">👥 ${memberText}</div>` : ''}
        </div>
        <div class="result-details" style="display: none; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
          ${result.reason ? `<div style="color: var(--text-secondary); font-size: 12px; line-height: 1.5;">${truncateText(result.reason, 300)}</div>` : ''}
          ${result.members && result.members.length > 0 ? `
            <div style="margin-top: 8px;">
              <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">Team Members:</div>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${result.members.map(m => `<span style="background: var(--bg-dark); padding: 2px 8px; border-radius: 4px; font-size: 11px;">${m.name}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
  
  // 添加点击展开功能
  container.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // 如果点击的是按钮，不触发展开
      if (e.target.closest('button')) return;
      const details = item.querySelector('.result-details');
      if (details) {
        details.style.display = details.style.display === 'none' ? 'block' : 'none';
      }
    });
  });
}

/**
 * 获取层级对应的颜色
 */
function getLevelColor(levelKey) {
  const colors = {
    'global': { bg: 'rgba(255, 45, 85, 0.2)', text: '#ff2d55' },
    'us': { bg: 'rgba(0, 122, 255, 0.2)', text: '#007aff' },
    'eu': { bg: 'rgba(88, 86, 214, 0.2)', text: '#5856d6' },
    'sea': { bg: 'rgba(255, 149, 0, 0.2)', text: '#ff9500' },
    'latam': { bg: 'rgba(52, 199, 89, 0.2)', text: '#34c759' },
    'fs': { bg: 'rgba(255, 59, 48, 0.2)', text: '#ff3b30' },
    'pop': { bg: 'rgba(175, 82, 222, 0.2)', text: '#af52de' },
    'rankings': { bg: 'rgba(255, 204, 0, 0.2)', text: '#ffcc00' },
    'departmental': { bg: 'rgba(90, 200, 250, 0.2)', text: '#5ac8fa' }
  };
  return colors[levelKey] || { bg: 'var(--bg-dark)', text: 'var(--text-secondary)' };
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
