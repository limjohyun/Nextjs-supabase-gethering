# 🗺️ 모임 이벤트 관리 웹 MVP 개발 로드맵

## 프로젝트 개요

- **프로젝트명**: 모임 이벤트 관리 웹 MVP (수영/헬스/친구모임 등 소규모 모임의 공지·참여자관리·카풀·정산 통합)
- **기술 스택**(저장소 실측 버전)
  - Next.js 16.2.11 (App Router)
  - React 19.2.8 + TypeScript
  - TailwindCSS 3.4.19 + shadcn/ui(new-york 스타일, 기존 `components.json` 재사용)
  - React Hook Form + Zod (이번 기능에서 신규 도입 — 아직 미설치)
  - Supabase(`@supabase/ssr`, `@supabase/supabase-js`) — 기존 3개 클라이언트 팩토리(`lib/supabase/client.ts` / `server.ts` / `proxy.ts`) 그대로 재사용
  - 테스트 프레임워크 없음(Vitest/Jest 미설치) — 이 로드맵은 수동 QA 체크리스트로 대체
- **팀 구성**: 1인 개발(주최자=개발자). 리뷰/페어 프로그래밍 단계 없음, 각 페이즈 완료 기준을 스스로 체크하고 다음 페이즈로 넘어가는 방식으로 진행.
- **진행 방식**: 기간·일정 추정은 이 로드맵에 포함하지 않는다. 각 페이즈는 "완료 기준" 체크리스트를 모두 충족해야 다음 페이즈로 넘어간다(페이즈 게이트 방식).

## 로드맵 설계 원칙 — 구조 우선 접근법

사용자의 전역 개발 원칙("구조 우선 접근법: 기능 구현에 앞서 라우팅/레이아웃/네비게이션/페이지 분리를 먼저 잡고 기능을 채운다")을 이 로드맵 전체의 설계 원칙으로 반영한다.

- **거시적 구조 우선**: Phase 0에서 전체 라우트·레이아웃·탭 구조·네비게이션을 먼저 완성한다. 이 시점에는 Supabase 마이그레이션이나 데이터 연동이 전혀 없다(정적/mock 데이터로만 렌더링).
- **미시적 구조 우선**: Phase 1 이후 각 기능 페이즈도 내부적으로 **A. UI 먼저 → B. 데이터 연동**의 2단계로 진행한다.
  - **A 단계(UI)**: 정적 마크업, 폼(React Hook Form + Zod 클라이언트 검증만 적용, 제출은 mock/console 처리), 목록/카드/탭 UI를 mock 데이터로 완성한다. 이 단계에서는 Supabase 쿼리·Server Action·마이그레이션이 없다.
  - **B 단계(데이터 연동)**: 해당 기능에 필요한 테이블 마이그레이션 + RLS 정책을 작성하고, `database.types.ts`를 재생성·커밋한 뒤, Server Action으로 실제 데이터를 연결하며 mock 데이터를 제거한다.
- 마이그레이션은 Phase 0에서 한꺼번에 만들지 않고, 각 기능 페이즈의 B 단계에서 그 기능에 필요한 테이블만 점진적으로 추가한다(PRD가 제안한 자체 로드맵 순서 "모임 골격 → 공지 → 카풀 → 정산"과 동일한 순서를 따름). 단, 뒤 페이즈의 RLS 조회 정책이 `event_participants`(승인된 참여자만 조회)를 참조하므로, Phase 2(참여자 관리)가 반드시 Phase 3~5보다 먼저 완료되어야 한다 — 자세한 내용은 [의존성 맵](#의존성-맵) 참고.

## 페이즈별 개발 계획

### Phase 0: 앱 골격 — 라우팅/레이아웃/네비게이션 (구조 우선 토대)

**목표**: 데이터 연동 없이, 신규 기능의 모든 화면 뼈대와 화면 간 이동 경로를 먼저 확정한다.

#### 핵심 기능

- [x] 라우트 생성(빈 페이지/레이아웃만): `/events`(모임 목록), `/events/new`(모임 생성), `/events/[id]`(모임 상세), `/events/[id]/edit`(모임 수정), `/my`(내 모임) — `MUST`
- [x] 기존 `/auth/*` 로그인·회원가입 플로우는 신규 구현 없이 그대로 링크만 연결 — `MUST` (F020)
- [x] 모임 상세 페이지(`/events/[id]`) 내부 탭 구조 골격: 기본정보 / 공지 / 참여자 / 카풀 / 정산 — `MUST`
- [x] 공통 네비게이션에 "모임 목록 / 모임 만들기 / 내 모임 / 로그아웃" 메뉴 추가 — `MUST`
- [x] 각 페이지 빈 상태(empty state)/로딩 상태 UI(Suspense 스켈레톤 등) — `SHOULD` (동적 params 접근이 Next.js 16 Cache Components의 "Blocking Route" 이슈로 잡혀 `<Suspense>` 경계로 해결, 결과적으로 로딩 폴백도 함께 갖춰짐)

#### 기술적 준비 작업

- [x] React Hook Form, Zod 설치 및 `package.json` 반영
- [x] 신규 라우트가 `/protected` 하위가 아닌 최상위 라우트임을 확인(`/instruments`와 동일 위치 규칙, `proxy.ts`가 `/`, `/login*`, `/auth*` 제외 전부 인증 게이팅 처리하므로 별도 게이팅 코드 불필요)
- [x] 공용 UI 컴포넌트 셸 준비(shadcn 기반): 모임 카드, 상태 배지(open/closed/cancelled, pending/approved/rejected 등), 탭 컨테이너
- [x] `app/instruments/page.tsx` 패턴(Server Component + Suspense) 재사용 여부를 각 신규 페이지 레이아웃에 미리 반영

#### 예상 완료 결과물

- 로그인 후 "모임 목록 → 모임 생성/상세 → 내 모임" 전체 화면을 mock/placeholder 데이터로 클릭해서 돌아다닐 수 있는 상태
- Supabase 쿼리는 아직 하나도 없음(테이블도 아직 없음)

#### 완료 기준(체크리스트)

- [x] 신규 라우트 5개 모두 접근 가능하고 페이지 간 이동(네비게이션 클릭 → 이동)이 끊김 없이 동작
- [x] 모임 상세 탭 5개(기본정보/공지/참여자/카풀/정산)가 모두 렌더링됨(내용은 placeholder)
- [x] `npm run lint`, `npm run typecheck` 통과

**✅ 완료** — 브라우저 실사용 검증까지 통과. 신규 nav를 `app/layout.tsx`에 두면 `/`·`/protected`의 기존 인라인 nav와 중복 렌더링됨을 확인해 `app/events/layout.tsx`·`app/my/layout.tsx` 두 곳으로 분리.

#### 위험 요소

- **과설계 위험**: 아직 데이터 모델이 코드에 없는 상태에서 UI 컴포넌트 props를 너무 이르게 확정하면 Phase 1 이후 리팩터링이 커질 수 있음 → mock 데이터 타입은 최소한으로 느슨하게 유지하고, 실제 `Database` 타입은 각 페이즈 B 단계에서 확정
- **RHF+Zod 최초 도입**: 이 저장소에 폼 라이브러리가 처음 들어가는 것이므로, 여기서 정립한 폼 패턴(에러 표시, 클라이언트 검증 방식)을 이후 모든 폼(모임 생성/수정, 카풀 등록, 비용 항목 등록)에 일관되게 재사용해야 함

---

### Phase 1: 모임 골격 — UI → 데이터 연동 (F001~F005)

**목표**: 모임 생성/목록/상세/수정/취소가 실제 Supabase 데이터로 동작한다.

#### 1-A. UI 먼저 (mock 데이터)

- [x] 모임 생성 폼: 제목/설명/카테고리(수영·헬스·친구모임·기타)/일시/장소/정원, RHF+Zod 클라이언트 검증, 제출은 mock 처리 — `MUST` (F001)
- [x] 모임 수정 폼: 기존 값 프리필 형태의 동일 폼(mock 데이터로 프리필) — `MUST` (F004)
- [x] 모임 목록 카드 UI: 제목/카테고리/일시/장소/정원 대비 신청 현황, mock 배열 렌더링 — `MUST` (F002)
- [x] 모임 상세 기본정보 탭 UI + 주최자 전용 "수정"/"모임 취소" 버튼(취소는 확인 다이얼로그 포함) — `MUST` (F003, F005)

**✅ 1-A 완료** — 브라우저 실사용 검증까지 통과(카드 클릭→상세 이동, mock 주최자 체크박스 토글, 취소 Dialog, edit prefill, 5개 필드 한국어 검증 에러). `z.coerce.number()`와 `z.enum(values, { error })` 객체 파라미터가 이 저장소의 zod 4.4.3에서 각각 타입 불일치·런타임 무응답 버그를 일으켜 `z.number()`+수동 `valueAsNumber` 처리, 문자열 shorthand(`z.enum(values, "메시지")`)로 교체.

#### 1-B. 데이터 연동

- [x] `supabase/migrations` 디렉터리 신설, `events` 테이블 마이그레이션 작성(id, host_id, title, description, category, location, event_datetime, capacity, status, created_at, updated_at)
- [x] RLS 정책: 조회는 전체 공개(모든 모임 공개 원칙), 쓰기(생성/수정/취소)는 `auth.uid() = host_id`만 허용
- [x] `database.types.ts` 재생성 및 커밋
- [x] 모임 생성/목록/상세/수정/취소를 Server Action + `supabase.from("events")`로 연결, mock 데이터 제거
- [x] 모임 상세 페이지에서 `profiles`를 조인해 주최자 이름 표시(F021 일부)

**✅ 1-B 완료** — 브라우저 실사용 검증(실 Supabase 데이터)까지 통과: 생성→목록 반영→상세(주최자 이름 조인 표시)→수정(datetime-local prefill 포함)→취소 end-to-end 확인, `pg_policies` 조회로 RLS도 재확인. 계획에 없던 발견: `profiles` 테이블의 기존 SELECT 정책이 "본인 행만 조회 가능"이라 주최자 이름 조인이 다른 사용자에겐 null이 되는 문제를 사전 조사로 발견 — `profiles`에 "인증된 사용자는 모든 프로필을 조회할 수 있다" 정책을 추가해 해결(Phase 2 참여자 목록 표시에도 동일 적용, 재작업 불필요).

#### 예상 완료 결과물

- 로그인한 사용자가 실제로 모임을 만들고, 목록에서 보고, 상세를 보고, 수정/취소할 수 있는 완결된 흐름(참여자/공지/카풀/정산 제외)

#### 완료 기준(체크리스트)

- [x] 모임 생성 → 목록에 즉시 반영 → 상세 진입 → 수정 → 변경 반영 → 취소까지 실 데이터로 end-to-end 동작
- [x] 본인이 아닌 모임에서 수정/취소 버튼이 노출되지 않음(RLS + UI 조건 이중 확인)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` 통과

#### 위험 요소

- **RLS 최초 적용**: 이 프로젝트에서 `profiles`/`instruments` 외 테이블에 RLS를 처음 적용하는 페이즈. 정책 문법 실수 시 전체 차단/전체 노출 둘 다 위험 → `mcp__supabase__get_advisors`로 정책 적용 직후 점검
- **`database.types.ts` 재생성 누락**: 재생성을 잊어도 빌드가 깨지지 않고 타입만 stale해지는 함정이 있음(CI가 재생성하지 않음, `CLAUDE.md` 명시) → 마이그레이션 커밋 시 체크리스트에 명시적으로 포함

---

### Phase 2: 참여자 관리 — UI → 데이터 연동 (F008~~F013, F011~~F012, F021)

**목표**: 참여 신청/승인/거절/취소, 내 모임 페이지가 실제 데이터로 동작한다. 이후 모든 페이즈의 RLS 조회 정책이 이 단계의 `event_participants`를 참조하므로 반드시 Phase 3~5보다 먼저 완료한다.

#### 2-A. UI 먼저 (mock 데이터)

- [x] 모임 상세 "참여자" 탭: 참여 신청 버튼(중복 신청 시 비활성화 상태 mock), 주최자용 참여자 목록 + 승인/거절 버튼, 참여자 본인의 참여 취소 버튼 — `MUST` (F008~F010, F013)
- [x] 내 모임 페이지 UI: "주최한 모임" / "참여한 모임" 두 목록, 참여한 모임의 신청 상태 배지(pending/approved/rejected/cancelled), 참여 취소 버튼 — `MUST` (F011, F012, F013)

**✅ 2-A 완료** — 브라우저 실사용 검증까지 통과(참여자 탭 승인 클릭 시 배지 전환·버튼 숨김, `/my` 참여 취소 클릭 시 배지 전환 확인). `isHost`는 별도 mock 플래그 없이 Phase 1-B에서 계산한 실제 `auth.uid()===host_id` 값을 그대로 재사용.

#### 2-B. 데이터 연동

- [x] `event_participants` 테이블 마이그레이션 추가(id, event_id, user_id, status, applied_at, UNIQUE(event_id, user_id))
- [x] RLS 정책: 본인 신청 생성/취소는 `auth.uid() = user_id`, 승인/거절은 해당 모임 `host_id`만, 조회는 신청자 본인 또는 해당 모임 주최자
- [x] `database.types.ts` 재생성 및 커밋
- [x] 참여 신청/승인/거절/취소를 Server Action으로 연결(중복 신청 방지는 UNIQUE 제약 + UI 비활성화 이중 처리)
- [x] 내 모임 페이지를 실 데이터(주최한 모임: `events.host_id = auth.uid()`, 참여한 모임: `event_participants.user_id = auth.uid()` 조인)로 연결
- [x] 참여자 목록에 `profiles`(full_name/avatar_url/username) 조인 표시 완성(F021)

**✅ 2-B 완료** — 브라우저 실사용 검증(실 Supabase 데이터, 실제 두 계정 간 상호작용)까지 통과: 주최자 계정에서 참여자 승인 클릭 → 상태 반영, 참여자 계정에서 참여 신청/취소 클릭 → 상태 반영, `/my` 페이지가 로그인 사용자 기준 주최/참여 목록을 정확히 분리 표시. DB 레벨에서 중복 신청 시 `event_participants_event_id_user_id_key` unique 제약 위반 확인. 참여자 취소 RLS는 `with check (auth.uid() = user_id and status = 'cancelled')`로 제한해, 본인 신청 행을 승인 상태로 자가 변경(자가 승인)하는 권한 상승 경로를 원천 차단. `get_advisors` 점검 결과 신규 테이블 관련 보안 항목 없음(기존 leaked-password-protection 경고만 존재, 무관).

#### 예상 완료 결과물

- 참여자가 신청하고, 주최자가 승인/거절하고, 양쪽 모두 "내 모임"에서 현재 상태를 확인할 수 있는 완결된 흐름

#### 완료 기준(체크리스트)

- [x] 동일 사용자가 동일 모임에 중복 신청 불가(DB 제약 + UI 양쪽에서 확인)
- [x] 주최자만 승인/거절 가능, 참여자는 본인 신청만 취소 가능(RLS로 검증)
- [x] 내 모임 페이지의 "주최한 모임"/"참여한 모임" 목록이 실제 로그인 사용자 기준으로 정확히 분리되어 표시됨
- [x] `npm run lint`, `npm run typecheck`, `npm run build` 통과

#### 위험 요소

- **후속 페이즈 의존성**: 이 페이즈의 `event_participants`가 공지/카풀/정산 조회 RLS("승인된 참여자만 조회")의 전제 조건 → 여기서 상태값(pending/approved/rejected/cancelled) 정의가 흔들리면 이후 3개 페이즈의 정책을 다시 손봐야 함
- **동시 신청/취소 경합**: 승인 처리 중 참여자가 취소하는 등 상태 전이 경합 가능성 → Server Action에서 최신 상태 재확인 후 처리

---

### 🎨 UI/UX 개선 페이즈 (Phase 2와 Phase 3 사이에 삽입)

Phase 2 완료 후, Gather 앱 참고 이미지를 바탕으로 지금까지 만든 화면(랜딩·모임 목록·내 모임·모임 생성)의 시각적 완성도를 끌어올리는 별도 페이즈 묶음을 진행했다. 상세 내용은 별도 문서 [`gathering-event-mvp-ui-ux-roadmap.md`](./gathering-event-mvp-ui-ux-roadmap.md)(Phase UX-1~UX-5)를 참고.

**✅ 완료** — UX-1(디자인 토대) ~ UX-5(반응형 하단 네비게이션) 전체 완료. 이제 아래 Phase 3(공지)부터 재개한다.

---

### Phase 3: 공지 — UI → 데이터 연동 (F006~F007)

**목표**: 모임 상세 "공지" 탭이 실제 데이터로 동작한다.

#### 3-A. UI 먼저 (mock 데이터)

- [x] 주최자 전용 공지 작성 폼(텍스트, 첨부파일 없음) — `MUST` (F006)
- [x] 공지 목록 UI(최신순) — `MUST` (F007)

#### 3-B. 데이터 연동

- [x] `announcements` 테이블 마이그레이션 추가(id, event_id, content, created_at)
- [x] RLS 정책: 쓰기는 해당 모임 `host_id`만, 조회는 해당 모임의 승인된 참여자 또는 주최자(Phase 2의 `event_participants` 참조)
- [x] `database.types.ts` 재생성 및 커밋
- [x] 작성/목록 조회를 Server Action으로 연결, mock 제거

#### 예상 완료 결과물

- 주최자가 공지를 작성하면 승인된 참여자가 즉시 목록에서 확인 가능

#### 완료 기준(체크리스트)

- [x] 주최자가 아닌 사용자에게 공지 작성 UI가 노출되지 않음
- [x] 승인되지 않은 신청자(pending/rejected)에게는 공지 조회가 제한됨(RLS로 검증)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` 통과

**✅ 완료** — 브라우저 실사용 검증(실 Supabase 데이터)까지 통과: 주최자 계정에서 공지 작성 → 목록 최상단 반영 확인. RLS는 SQL 트랜잭션(롤백)으로 3가지 경로 모두 직접 검증: ①비참여자/비주최자는 조회 0건, ②승인된 참여자로 임시 등록 후 조회 시 1건 정상 노출, ③비주최자가 INSERT 시도 시 "new row violates row-level security policy" 예외로 거부. `get_advisors` 점검 결과 신규 테이블 관련 보안 항목 없음.

#### 위험 요소

- 4개 기능 중 가장 단순한 페이즈지만, "승인된 참여자만 조회" RLS 패턴을 처음 실전 적용하는 단계이므로 여기서 패턴을 확정해 카풀/정산 페이즈에 그대로 재사용

---

### Phase 4: 카풀 — UI → 데이터 연동 (F014~F016)

**목표**: 카풀 등록/좌석 신청/확정(초과 확정 하드 블록 포함)이 실제 데이터로 동작한다.

#### 4-A. UI 먼저 (mock 데이터)

- [x] 카풀 등록 폼: 출발지(텍스트)/출발시간/좌석수, RHF+Zod 검증 — `MUST` (F014)
- [x] 좌석 신청 버튼(참여자용, 1건=1석) — `MUST` (F015)
- [x] 운전자용 신청 목록 + 확정 버튼(mock 상태에서 confirmed 건수가 seat_count 초과 시 버튼 비활성화 UI만 우선 구현) — `MUST` (F016)

#### 4-B. 데이터 연동

- [x] `carpools`, `carpool_requests` 테이블 마이그레이션 추가
- [x] RLS 정책: 카풀 등록/수정은 `auth.uid() = driver_id`, 좌석 신청은 로그인 사용자 본인, 확정 처리는 해당 카풀 `driver_id`만, 조회는 해당 모임 승인된 참여자
- [x] `database.types.ts` 재생성 및 커밋
- [x] 확정 처리 로직: `confirmed` 건수가 `seat_count`를 초과하면 서버 단에서 차단 — `confirm_carpool_request` SECURITY DEFINER 함수가 `carpools` 행을 `SELECT ... FOR UPDATE`로 잠근 뒤 재검증해 동시 확정 요청에도 직렬화됨
- [x] mock 데이터 제거

#### 예상 완료 결과물

- 운전자가 카풀을 등록하고, 참여자가 좌석을 신청하고, 운전자가 확정하되 좌석 초과 확정은 시스템이 차단하는 완결된 흐름

#### 완료 기준(체크리스트)

- [x] `seat_count`를 초과하는 확정 시도가 UI/서버 양쪽에서 모두 차단됨(SQL 트랜잭션으로 동시 확정 시나리오 재현 검증: 비운전자 차단/운전자 확정 성공/좌석 초과 시 두 번째 확정 차단 모두 확인)
- [x] 좌석 신청 1건 = 1석 규칙이 지켜짐(여러 좌석 필요 시 여러 번 신청)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` 통과

#### 위험 요소

- **동시성**: 두 명이 거의 동시에 마지막 좌석을 확정 시도하면 단순 조건문만으로는 `seat_count` 초과를 막지 못할 수 있음(race condition) → 확정 처리 시 최신 `confirmed` 카운트를 재조회한 뒤 확정하는 순서를 반드시 지킬 것(테스트 프레임워크가 없으므로 수동으로 동시 요청을 재현해 확인)

---

### Phase 5: 정산 — UI → 데이터 연동 (F017~F019)

**목표**: 비용 항목 등록, 참여자별 분담액 자동 계산, 정산 완료 체크가 실제 데이터로 동작한다.

#### 5-A. UI 먼저 (mock 데이터)

- [ ] 비용 항목 등록 폼: 항목명/금액/결제자(다중 선택 가능) — `MUST` (F017)
- [ ] 참여자별 분담액 표(1/N 계산 결과 표시, mock 데이터) — `MUST` (F018)
- [ ] 정산 완료 체크박스 UI(참여자별) — `MUST` (F019)

#### 5-B. 데이터 연동

- [ ] `settlements`, `settlement_shares` 테이블 마이그레이션 추가
- [ ] RLS 정책: `settlements` 쓰기는 해당 모임 `host_id`만, `settlement_shares.is_paid` 갱신은 host 또는 본인(정책 방향은 구현 시 확정), 조회는 승인된 참여자
- [ ] `database.types.ts` 재생성 및 커밋
- [ ] 비용 항목 등록 시 결제자가 여러 명이면 항목 금액을 결제자 수로 1/N 분할해 각 결제자 앞으로 개별 `settlements` 행 생성
- [ ] `settlement_shares` 재계산 로직: 비용 항목이 바뀔 때마다 참여자별 `amount_owed`를 참여자 수 기준 1/N로 재계산해 upsert하되, 기존 `is_paid` 값은 덮어쓰지 않고 보존
- [ ] mock 데이터 제거

#### 예상 완료 결과물

- 주최자가 비용 항목을 등록하면 참여자별 분담액이 자동 계산되어 표시되고, 정산 완료 체크가 항목 변경과 무관하게 보존되는 완결된 흐름

#### 완료 기준(체크리스트)

- [ ] 결제자가 2명 이상인 항목이 1/N로 정확히 분할되어 각 결제자 앞으로 개별 기록됨
- [ ] 참여자별 분담액이 참여자 수 기준 1/N로 정확히 계산됨
- [ ] 비용 항목을 추가/수정한 뒤에도 이미 체크된 "정산 완료" 상태가 유지됨(재계산 시 `is_paid` 유실 여부를 직접 재현해 확인)
- [ ] `npm run lint`, `npm run typecheck`, `npm run build` 통과

#### 위험 요소

- **`is_paid` 유실**: `amount_owed` 재계산 upsert 시 `is_paid`를 기본값으로 되돌리는 실수가 나기 쉬움(4개 기능 중 유일하게 "재계산되는 값"과 "수동 보존되는 값"이 한 테이블에 공존) → upsert 시 `is_paid`를 명시적으로 conflict 대상에서 제외
- **금액 계산 정밀도**: 1/N 분할 시 나눗셈 나머지 처리(반올림 규칙)를 명확히 정하지 않으면 총합이 원금액과 어긋날 수 있음 → 반올림 규칙을 구현 시 확정하고 완료 기준 체크리스트에 합계 검증 추가

---

### Phase 6: 통합 QA · 배포 · 문서화

**목표**: 4개 기능(모임/참여자/공지/카풀/정산)이 한 사용자 여정 안에서 함께 동작함을 확인하고 배포한다.

#### 핵심 기능

- [ ] PRD의 사용자 여정(주최자 경로/참여자 경로) 전체를 실제로 한 번씩 수동으로 실행 — `MUST`
- [ ] `mcp__supabase__get_advisors`로 전체 테이블 RLS/보안 자문 점검 — `MUST`
- [ ] 반응형(모바일/데스크톱) 레이아웃 점검 — `SHOULD`
- [ ] Vercel 배포(마이그레이션 원격 프로젝트 적용 포함) — `MUST`

#### 기술적 준비 작업

- [ ] 원격 Supabase 프로젝트에 `supabase/migrations` 전체 적용 확인
- [ ] 환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) 배포 환경 설정 확인

#### 예상 완료 결과물

- 배포된 프로덕션 URL에서 PRD 사용자 여정 전체가 동작
- `docs/guides/*`, `CLAUDE.md`에 신규 라우트/RHF+Zod 폼 패턴/`supabase/migrations` 컨벤션 반영

#### 완료 기준(체크리스트)

- [ ] 주최자 경로(모임 생성 → 공지 → 참여자 승인 → 카풀 등록 → 비용 등록 → 정산 완료 체크) 전체 통과
- [ ] 참여자 경로(모임 조회 → 참여 신청 → 승인 대기/확인 → 카풀 좌석 신청 → 정산 금액 확인) 전체 통과
- [ ] `get_advisors` 점검에서 발견된 항목 조치 완료 또는 의도적 예외로 기록
- [ ] 프로덕션 배포 후 실제 URL에서 위 두 경로 재확인
- [ ] `docs/guides/*`, `CLAUDE.md` 최신화 완료

#### 위험 요소

- **테스트 프레임워크 부재**: 자동 회귀 테스트 없이 수동 QA에 의존 → 이 페이즈의 체크리스트가 사실상 유일한 회귀 방지망이므로 생략하지 않고 매 배포 전 반복 실행할 것을 권장(향후 정산 1/N 계산·카풀 초과 차단처럼 순수 계산 로직만이라도 Vitest로 단위 테스트화하는 것을 후속 과제로 고려)
- **스코프 크리프**: PRD가 4개 기능 모두 "얕게"를 명시했으므로, 통합 QA 중 발견된 개선 아이디어는 이번 MVP 범위에 바로 추가하지 않고 별도 backlog로 분리

## 주요 마일스톤

| 마일스톤              | 완료 기준                                                                             | 핵심 산출물                                              | 상태    |
| --------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------- |
| M0. 앱 골격 완성      | Phase 0 완료 기준 충족                                                                | 전체 라우트/네비게이션/탭 구조(mock 데이터)              | ✅ 완료 |
| M1. 모임 골격 동작    | Phase 1 완료 기준 충족                                                                | 모임 생성/목록/상세/수정/취소 실 데이터 연동             | ✅ 완료 |
| M2. 참여자 관리 동작  | Phase 2 완료 기준 충족                                                                | 참여 신청/승인/거절/취소, 내 모임 페이지 실 데이터 연동  | ✅ 완료 |
| M2.5. UI/UX 개선 완료 | [UI/UX 로드맵](./gathering-event-mvp-ui-ux-roadmap.md) Phase UX-1~UX-5 완료 기준 충족 | 랜딩 리뉴얼, 카드형 목록, 프로필 페이지, 반응형 하단 nav | ✅ 완료 |
| M3. 공지 동작         | Phase 3 완료 기준 충족                                                                | 공지 작성/목록 실 데이터 연동                            | ✅ 완료 |
| M4. 카풀 동작         | Phase 4 완료 기준 충족                                                                | 카풀 등록/좌석 신청/확정(하드 블록) 실 데이터 연동       | ✅ 완료 |
| M5. 정산 동작         | Phase 5 완료 기준 충족                                                                | 비용 항목 등록/1·N 분담/정산 완료 체크 실 데이터 연동    | ⬜ 대기 |
| M6. MVP 배포 완료     | Phase 6 완료 기준 충족                                                                | 프로덕션 배포 + 통합 QA 통과 + 문서화 반영               | ⬜ 대기 |

## 크로스컷팅 관심사(Cross-cutting Concerns)

### 테스팅 전략

- 이 저장소에는 테스트 프레임워크가 구성되어 있지 않다(Vitest/Jest 미설치). 이 로드맵에서는 자동화 테스트를 새로 구성하지 않고, 각 페이즈의 "완료 기준" 체크리스트를 수동 QA로 사용한다.
- 매 페이즈 공통 검증: `npm run lint`, `npm run typecheck`, `npm run build` 통과를 완료 기준에 포함(기존 CI가 동일 명령을 실행하므로 로컬에서 먼저 통과시켜 CI 실패를 예방).
- 경계값·계산 로직(카풀 초과 확정 차단, 정산 1/N 분할, `is_paid` 보존)은 특히 수동으로 "일부러 깨보는" 시나리오를 완료 기준에 명시했다(Phase 4, 5 참고).
- 후속 과제(이번 로드맵 범위 밖): 정산 1/N 계산, 카풀 초과 차단처럼 순수 함수로 분리 가능한 로직에 한해 Vitest 도입을 검토할 수 있음.

### 배포 계획

- Phase 0~5는 로컬(개발 Supabase 프로젝트) 기준으로 진행하고, Phase 6에서 원격 Supabase 프로젝트에 `supabase/migrations`를 일괄 적용한 뒤 Vercel에 배포한다.
- 마이그레이션은 각 기능 페이즈(1-B~5-B)에서 순차적으로 추가되므로, 원격 적용 시에도 동일한 순서(`events` → `event_participants` → `events.cover_image_url`(UI/UX 개선 페이즈) → `announcements` → `carpools`/`carpool_requests` → `settlements`/`settlement_shares`)로 쌓인 마이그레이션 파일을 그대로 적용하면 된다.

### 문서화 계획

- `lib/supabase/database.types.ts`: 페이즈별 마이그레이션 직후 즉시 재생성·커밋(누락 시 CI가 잡아주지 않는 점 주의).
- `docs/guides/*`(project-structure, component-patterns, styling-guide, nextjs-15 등): Phase 6에서 신규 라우트 구조·RHF+Zod 폼 패턴을 반영해 최신화.
- `CLAUDE.md`: `supabase/migrations` 디렉터리 신설, 신규 라우트 목록, RHF+Zod 도입 사실을 Phase 6에서 반영.
- 이 로드맵 파일(`docs/planning/gathering-event-mvp-roadmap.md`) 자체의 체크박스를 진행 상황 추적 용도로 갱신.

## 의존성 맵

```
Phase 0 (앱 골격, mock)
   │  (모든 화면 뼈대 완성 후에만 각 기능 UI 착수)
   ▼
Phase 1 (모임 골격 UI → events 연동)
   │  (event_id 외래키 대상인 events가 먼저 존재해야 함)
   ▼
Phase 2 (참여자 관리 UI → event_participants 연동)  ★ 후속 3개 페이즈의 RLS 전제 조건
   │
   ▼
🎨 UI/UX 개선 페이즈 (별도 문서: gathering-event-mvp-ui-ux-roadmap.md, Phase UX-1~UX-5)
   │
   ├──▶ Phase 3 (공지 UI → announcements 연동)
   ├──▶ Phase 4 (카풀 UI → carpools/carpool_requests 연동)
   └──▶ Phase 5 (정산 UI → settlements/settlement_shares 연동)
              │
              ▼
        Phase 6 (통합 QA · 배포 · 문서화)
```

- Phase 3~5는 서로 데이터 의존성이 없어 순서를 바꾸거나(예: 카풀보다 정산을 먼저) 병행해도 무방하다. 다만 Phase 2(참여자 관리)가 끝나기 전에는 착수하지 않는다 — "승인된 참여자만 조회" RLS 패턴이 `event_participants.status = 'approved'`를 참조하기 때문이다.
- Phase 2와 Phase 3 사이에는 UI/UX 개선 페이즈([`gathering-event-mvp-ui-ux-roadmap.md`](./gathering-event-mvp-ui-ux-roadmap.md))가 끼어든다. 데이터 모델에는 영향이 없지만(카드/랜딩/프로필 UI 작업), `events.cover_image_url` 컬럼이 추가되므로 Phase 3~5의 마이그레이션보다 먼저 적용되어야 마이그레이션 순서가 꼬이지 않는다.
- 각 페이즈 내부는 A(UI) → B(데이터 연동) 순서를 반드시 지킨다. B 단계를 A 단계보다 먼저 시작하지 않는다(구조 우선 원칙).

## 성공 기준

- [ ] F001~F021 전 기능이 PRD에 기술된 대로 프로덕션 환경에서 동작한다.
- [ ] 7개 신규 테이블 모두 RLS가 활성화되어 있고, `get_advisors` 점검에서 미해결 고위험 항목이 없다.
- [ ] 카풀 확정 시 `seat_count` 초과가 어떤 경로로도 발생하지 않는다(수동 동시 요청 재현 테스트 통과).
- [ ] 정산 항목을 여러 번 수정해도 참여자별 "정산 완료" 체크가 유실되지 않는다.
- [ ] `npm run lint`, `npm run typecheck`, `npm run build`, 기존 CI(GitHub Actions)가 모두 통과한다.
- [ ] `database.types.ts`, `docs/guides/*`, `CLAUDE.md`가 실제 구현 상태와 일치한다.
