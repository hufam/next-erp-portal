// 같은 GitHub Pages 계정의 모듈별 저장소. 배포 후 연결됩니다.
export const modules = [
 ['customerorder','고객주문관리','영업관리',false], ['quotation','견적관리','영업관리'], ['stockstatus','재고현황','재고관리',false],
 ['customer','고객정보관리','기준정보'], ['vendor','매입처관리','기준정보'], ['part','품목관리','기준정보'], ['rm','원자재관리','기준정보'], ['price','단가관리','기준정보'], ['bom','BOM 관리','기준정보'], ['process','가공공정관리','기준정보'], ['employee','사원정보관리','기준정보'], ['commoncode','공통코드관리','기준정보'],
 ['delivery','납기관리','영업관리',false], ['shipment','출하관리','영업관리',false],
 ['purchaseorder','구매발주관리','구매관리',false], ['purchasein','구매입고관리','구매관리',false], ['outsourcing','외주가공관리','구매관리',false],
 ['productionplan','생산계획관리','생산관리',false], ['workorder','작업지시관리','생산관리',false], ['mrp','자재소요량관리','생산관리',false], ['materialout','자재출고관리','생산관리',false], ['productionresult','생산실적관리','생산관리',false],
 ['stockcount','재고실사관리','재고관리',false], ['stockhistory','재고이력관리','재고관리',false],
 ['incominginspection','수입검사관리','품질관리',false], ['processinspection','공정검사관리','품질관리',false], ['outgoinginspection','출하검사관리','품질관리',false], ['nonconformance','부적합관리','품질관리',false],
 ['equipment','설비정보관리','설비관리',false], ['maintenance','설비보전관리','설비관리',false],
 ['taxinvoice','세금계산서관리','대금·마감',false], ['receivable','대금·미수금관리','대금·마감',false], ['monthclose','월마감관리','대금·마감',false], ['productioncost','제조원가관리','운영·경영',false]
]
export function moduleUrl(id, companyId) {
 const url = new URL(`../next-erp-${id}-pages/`, location.href)
 url.searchParams.set('module', id)
 url.searchParams.set('company', String(companyId))
 return url.href
}
