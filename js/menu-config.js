// 같은 GitHub Pages 계정의 모듈별 저장소. 배포 후 연결됩니다.
export const modules = [
 ['customerorder','고객주문관리','영업관리'], ['quotation','견적관리','영업관리'], ['stockstatus','재고현황','재고관리'],
 ['customer','고객정보관리','기준정보'], ['vendor','매입처관리','기준정보'], ['part','품목관리','기준정보'], ['rm','원자재관리','기준정보'], ['price','단가관리','기준정보'], ['bom','BOM 관리','기준정보'], ['process','가공공정관리','기준정보'], ['employee','사원정보관리','기준정보'], ['commoncode','공통코드관리','기준정보']
]
export function moduleUrl(id, companyId) {
 const url = new URL(`../next-erp-${id}-pages/`, location.href)
 url.searchParams.set('module', id)
 url.searchParams.set('company', String(companyId))
 return url.href
}
