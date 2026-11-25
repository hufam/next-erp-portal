// NEXT ERP WEB ERP 통합 포털 V2 — Supabase Auth + DB 메뉴
// 기존 업무별 고정 탭 이름을 유지합니다.
window.name = 'next_erp_portal'
// 비밀번호관리의 복귀 요청에만 응답합니다. 메뉴 실행/탭 관리에는 영향이 없습니다.
if (typeof BroadcastChannel !== 'undefined') {
  const portalReturnChannel = new BroadcastChannel('next_erp_portal_return')
  portalReturnChannel.onmessage = event => {
    const { type, requestId } = event.data || {}
    if (!requestId) return
    if (type === 'FIND_PORTAL') {
      portalReturnChannel.postMessage({ type: 'PORTAL_PRESENT', requestId })
    } else if (type === 'FOCUS_PORTAL') {
      window.focus() // 브라우저 정책에 따라 탭 활성화가 제한될 수 있습니다.
    }
  }
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js'
import { modules, moduleUrl } from './menu-config.js'
let selectedCompany = null
const requestedCompany = (new URLSearchParams(location.search).get('company') || '').trim().toUpperCase()
const validCompany = /^[A-Z0-9]{1,64}$/.test(requestedCompany)
const scopedCode = validCompany ? requestedCompany : ''
let publicCompanyName = ''
const companyLoginKey = 'next_erp_login_company_code'
async function lookupCompanyName() {
  if (!scopedCode) return
  const {data,error} = await client.rpc('rpc_portal_company_name',{p_company_code:scopedCode})
  if (!error && typeof data === 'string') publicCompanyName = data
}

const root = document.querySelector('#groups')
const authPanel = document.querySelector('#auth-panel')
const status = document.querySelector('#portal-status')
const logoutButton = document.querySelector('#logout-button')
const passwordChangeButton = document.querySelector('#password-change-button')
const userLabel = document.querySelector('#user-label')
const openedTabs = new Map()
let client
let authenticated = false

function setStatus(message, isError = false) {
  status.textContent = message
  status.classList.toggle('error', isError)
}
function updateMode() {
  const mode = document.querySelector('#mode')
  if (mode) mode.textContent = ''
}
window.addEventListener('resize', updateMode)
updateMode()


function showLogin(message = '') {
  authenticated = false
  selectedCompany = null
  root.replaceChildren()
  document.querySelector('#portal-content').hidden = true
  logoutButton.hidden = true
  passwordChangeButton.hidden = true
  userLabel.textContent = ''
  document.querySelector('#company-select').hidden = true
  document.title = publicCompanyName || 'NEXT ERP'
  document.querySelector('#portal-company-name').textContent = publicCompanyName || 'NEXT ERP'
  authPanel.hidden = false
  authPanel.innerHTML = `
    <div class="login-card">
      <div class="login-brand">NEXT ERP</div>
      <h2>ERP 로그인</h2>
      <p>${scopedCode ? "등록된 사번으로 로그인하십시오." : "등록된 회사코드와 사번으로 로그인하십시오."}</p>
      <form id="login-form">
        ${scopedCode ? '<h3 id="login-company-name"></h3>' : `<label for="login-company">회사코드</label>
        <input id="login-company" type="text" maxlength="64" autocapitalize="characters" autocomplete="organization" required>`}
        <label for="login-id">사번</label>
        <input id="login-id" type="text" maxlength="64" autocapitalize="characters" autocomplete="username" required>
        <label for="login-password">비밀번호</label>
        <input id="login-password" type="password" autocomplete="current-password" required>
        <button type="submit" id="login-button">로그인</button>
        <div class="password-entry"><a href="./password.html?mode=reset" target="next_erp_password_reset" rel="noopener">비밀번호관리</a></div>
        <div id="login-message" role="alert"></div>
      </form>
    </div>`
  if (scopedCode) document.querySelector('#login-company-name').textContent = publicCompanyName || scopedCode
  document.querySelector('#login-message').textContent = message
  if (scopedCode) document.querySelector('.password-entry a').href = './password.html?mode=reset&company=' + encodeURIComponent(scopedCode)
  document.querySelector('#login-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const button = document.querySelector('#login-button')
    const feedback = document.querySelector('#login-message')
    button.disabled = true
    feedback.textContent = ''
    try {
      const company_code = scopedCode || document.querySelector('#login-company').value.trim().toUpperCase()
      const emp_no = document.querySelector('#login-id').value.trim().toUpperCase()
      const password = document.querySelector('#login-password').value
      const response = await fetch(`${SUPABASE_URL}/functions/v1/employee-login`, {
        method: 'POST', headers: {'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY},
        body: JSON.stringify({company_code, emp_no, password})
      })
      if (!response.ok) {
        feedback.textContent = response.status === 429 ? '잠시 후 다시 시도하십시오.' : response.status === 503 ? '로그인 서비스 준비 중입니다.' : '회사코드, 사번 또는 비밀번호를 확인하십시오.'
        return
      }
      const data = await response.json()
      if (!data.access_token || !data.refresh_token || !data.company_id) throw new Error('Invalid login response')
      const { error } = await client.auth.setSession({access_token: data.access_token, refresh_token: data.refresh_token})
      if (error) throw error
      sessionStorage.setItem('next_erp_login_company', String(data.company_id))
      sessionStorage.setItem(companyLoginKey, company_code)
      await loadPortal()
    } catch (error) {
      feedback.textContent = '로그인 또는 메뉴 조회에 실패했습니다. 계정과 권한을 확인하십시오.'
      console.error('Portal sign-in failed')
    } finally {
      button.disabled = false
    }
  })
}

function renderMenus(rows) {
  root.replaceChildren()
  const grouped = new Map()
  for (const row of rows) {
    if (!row.web_group || !row.web_url) continue
    if (!grouped.has(row.web_group)) grouped.set(row.web_group, [])
    grouped.get(row.web_group).push(row)
  }
  // 그룹 순서는 현행 포털 순서로 유지; 새로운 그룹은 뒤에 표시합니다.
  const order = ['영업관리', '재고관리', '구매관리', '대금·마감', '기준정보', '운영·경영', '시스템관리']
  const names = [...grouped.keys()].sort((a,b) => {
    const ai = order.indexOf(a), bi = order.indexOf(b)
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.localeCompare(b, 'ko')
  })
  for (const groupName of names) {
    const section = document.createElement('section')
    section.className = 'group'
    const heading = document.createElement('h3')
    heading.textContent = groupName
    section.append(heading)
    const list = document.createElement('div')
    list.className = 'items'
    for (const row of grouped.get(groupName).sort((a,b) => (a.web_sort_order ?? 999) - (b.web_sort_order ?? 999) || a.menu_id - b.menu_id)) {
      const el = document.createElement('button')
      el.type = 'button'
      const enabled = row.web_enabled_yn === 'Y'
      el.className = enabled ? 'item active' : 'item disabled'
      el.disabled = !enabled
      el.setAttribute('aria-label', enabled ? `${row.menu_name} 실행` : `${row.menu_name} 준비 중`)
      const label = document.createElement('span')
      label.className = 'item-label'
      label.textContent = row.menu_name
      const state = document.createElement('span')
      state.className = 'status'
      state.textContent = enabled ? '열기 ↗' : '준비 중'
      el.append(label, state)
      if (enabled) el.addEventListener('click', () => {
        if (!authenticated) { showLogin('로그인 세션이 종료되었습니다.'); return }
        // DB URL은 개발자가 등록한 신뢰된 HTTPS 주소만 실행합니다.
        let url
        try { url = new URL(row.web_url) } catch { setStatus('등록된 WEB 주소가 올바르지 않습니다.', true); return }
        if (url.protocol !== 'https:') { setStatus('HTTPS 주소만 실행할 수 있습니다.', true); return }
        if (matchMedia('(max-width: 700px)').matches) { location.assign(url.href); return }
        const tabName = 'next_erp_' + selectedCompany.company_id + '_' + String(row.menu_code).replace(/[^a-zA-Z0-9_]/g, '_')
        const tab = window.open(url.href, tabName)
        if (tab) { openedTabs.set(tabName, tab); tab.focus() }
        else setStatus('팝업이 차단되었습니다. 브라우저의 새 탭 허용 설정을 확인하십시오.', true)
      })
      list.append(el)
    }
    section.append(list)
    root.append(section)
  }
  setStatus(rows.length ? '' : '접근 가능한 WEB 업무 메뉴가 없습니다.')
}

async function loadPortal() {
  const { data: { user }, error: userError } = await client.auth.getUser()
  if (userError || !user) { showLogin(); return }
  const { data: companies, error } = await client.rpc('rpc_my_company_list')
  if (error) throw error
  const loginCompany = sessionStorage.getItem('next_erp_login_company')
  if (!loginCompany || (scopedCode && sessionStorage.getItem(companyLoginKey) !== scopedCode)) { showLogin(); return }
  const allowedCompany = companies?.find(c => String(c.company_id) === loginCompany)
  if (!allowedCompany) { sessionStorage.removeItem('next_erp_login_company'); sessionStorage.removeItem(companyLoginKey); showLogin('접근 가능한 회사가 없습니다.'); return }
  const scopedCompanies = [allowedCompany]
  authenticated = true
  authPanel.hidden = true
  document.querySelector('#portal-content').hidden = false
  logoutButton.hidden = false
  passwordChangeButton.hidden = false
  const picker = document.querySelector('#company-select')
  picker.replaceChildren()
  for (const company of scopedCompanies) {
    const option = document.createElement('option')
    option.value = String(company.company_id)
    option.textContent = company.company_name
    picker.append(option)
  }
  picker.hidden = true
  async function selectCompany() {
    const company = scopedCompanies.find(c => String(c.company_id) === picker.value)
    selectedCompany = company
    root.replaceChildren()
    userLabel.textContent = '사원정보 확인 중'
    document.title = company.company_name
    document.querySelector('#portal-company-name').textContent = company.company_name
    // 인증 사용자와 선택 회사에 연결된 사원만 표시합니다.
    const profileTask = client.from('md_employee')
      .select('emp_no,emp_name').eq('company_id', company.company_id)
      .eq('auth_user_id', user.id).eq('active_yn', 'Y').maybeSingle()
    void Promise.resolve(profileTask).then(({data: employee, error: profileError}) => {
      if (selectedCompany !== company || !authenticated) return
      userLabel.textContent = !profileError && employee?.emp_no && employee?.emp_name
        ? `${employee.emp_no}-${employee.emp_name}` : '사원정보 미연결'
      if (profileError) console.error('Portal employee lookup:', profileError)
    }).catch(error => {
      if (selectedCompany === company && authenticated) userLabel.textContent = '사원정보 조회 실패'
      console.error('Portal employee lookup:', error)
    })
    const { data, error } = await client.rpc('rpc_next_company_module_list', {p_company_id: company.company_id})
    if (selectedCompany !== company || !authenticated) return
    if (error) { setStatus('회사별 메뉴 조회 실패', true); return }
    const allowed = new Set((data || []).map(r => r.module_code))
    renderMenus(modules.filter(m => allowed.has(m[0])).map(([id, name, group], i) => ({menu_id:i, menu_code:id, menu_name:name, web_group:group, web_url:moduleUrl(id, company.company_id), web_enabled_yn:'Y', web_sort_order:i})))
  }
  picker.onchange = () => { void selectCompany() }
  await selectCompany()
}

passwordChangeButton.addEventListener('click', () => {
  if (!authenticated) { showLogin('로그인이 필요합니다.'); return }
  const url = new URL('./password.html?mode=change', location.href)
  if (scopedCode) url.searchParams.set('company', scopedCode)
  const tab = window.open(url.href, 'next_erp_password_change')
  if (tab) { openedTabs.set('next_erp_password_change', tab); tab.focus() }
  else setStatus('팝업이 차단되었습니다. 브라우저의 새 탭 허용 설정을 확인하십시오.', true)
})

logoutButton.addEventListener('click', async () => {
  logoutButton.disabled = true
  try {
    const { error } = await client.auth.signOut()
    if (error) throw error
    for (const tab of openedTabs.values()) {
      try { if (!tab.closed) tab.close() } catch { /* 브라우저가 차단할 수 있음 */ }
    }
    openedTabs.clear()
    showLogin('로그아웃되었습니다.')
  } catch (error) {
    setStatus('로그아웃에 실패했습니다. 다시 시도하십시오.', true)
    console.error('Portal sign-out:', error)
  } finally {
    logoutButton.disabled = false
  }
})

async function initialize() {
  if (SUPABASE_URL.startsWith('REPLACE_') || SUPABASE_PUBLISHABLE_KEY.startsWith('REPLACE_')) {
    setStatus('js/supabase-config.js에 기존 Supabase URL과 공개 키를 설정하십시오.', true)
    return
  }
  client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  })
  // 다른 탭에서 로그아웃한 경우 포털을 잠급니다.
  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') { sessionStorage.removeItem('next_erp_login_company'); sessionStorage.removeItem(companyLoginKey); showLogin('로그인 세션이 종료되었습니다.') }
  })
  try { await lookupCompanyName(); await loadPortal() }
  catch (error) {
    console.error('Portal initialization:', error)
    showLogin('메뉴 조회에 실패했습니다. 관리자에게 문의하십시오.')
  }
}
initialize()
