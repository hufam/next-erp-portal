# NEXT ERP WEB ERP PORTAL V1
HR COMP 원본 포털 기반 독립 정적 사이트. CSS 원본 유지.

- 저장소 next-erp-portal, Pages main / root. ZIP 내부 파일을 루트에 업로드.
- NEXT ERP 이메일 인증, rpc_my_company_list, rpc_next_company_module_list 사용.
- 모듈별 next-erp-{id}-pages 배포 필요. 아직 배포되지 않은 모듈은 열리지 않습니다.
- 동일 GitHub Pages origin에서 모듈과 인증 세션 공유. 각 모듈 진입부에서 회사 및 모듈 권한 재검증 필요.
- 비밀번호 재설정 사용 전 Supabase Auth Redirect URLs에 실제 포털 password.html 주소 등록.
- 실제 로그인, 권한, 모듈 연결은 배포 후 검증 필요.
