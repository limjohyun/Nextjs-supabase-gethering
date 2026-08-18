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

- [x] 비용 항목 등록 폼: 항목명/금액/결제자(다중 선택 가능) — `MUST` (F017)
- [x] 참여자별 분담액 표(1/N 계산 결과 표시, mock 데이터) — `MUST` (F018)
- [x] 정산 완료 체크박스 UI(참여자별) — `MUST` (F019)

#### 5-B. 데이터 연동

- [x] `settlements`, `settlement_shares` 테이블 마이그레이션 추가
- [x] RLS 정책: `settlements` 쓰기는 해당 모임 `host_id`만(`register_settlement_item` SECURITY DEFINER 함수를 통해서만 생성, 직접 INSERT 경로 없음), `settlement_shares.is_paid` 갱신은 host 또는 본인(컬럼 단위 권한으로 `is_paid`만 노출), 조회는 host/승인된 참여자
- [x] `database.types.ts` 재생성 및 커밋
- [x] 비용 항목 등록 시 결제자가 여러 명이면 항목 금액을 결제자 수로 1/N 분할해 각 결제자 앞으로 개별 `settlements` 행 생성
- [x] `settlement_shares` 재계산 로직: 비용 항목이 바뀔 때마다 참여자별 `amount_owed`를 참여자 수 기준 1/N로 재계산해 upsert하되, 기존 `is_paid` 값은 덮어쓰지 않고 보존
- [x] mock 데이터 제거

#### 예상 완료 결과물

- 주최자가 비용 항목을 등록하면 참여자별 분담액이 자동 계산되어 표시되고, 정산 완료 체크가 항목 변경과 무관하게 보존되는 완결된 흐름

#### 완료 기준(체크리스트)

- [x] 결제자가 2명 이상인 항목이 1/N로 정확히 분할되어 각 결제자 앞으로 개별 기록됨(나머지는 앞쪽 결제자부터 1원씩 배분, 합계가 원금액과 정확히 일치하도록 SQL로 검증)
- [x] 참여자별 분담액이 참여자 수 기준 1/N로 정확히 계산됨
- [x] 비용 항목을 추가/수정한 뒤에도 이미 체크된 "정산 완료" 상태가 유지됨(두 번째 항목 등록 후 `is_paid`가 그대로 `true`로 남아있음을 SQL로 직접 재현해 확인)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` 통과

#### 위험 요소

- **`is_paid` 유실**: `amount_owed` 재계산 upsert 시 `is_paid`를 기본값으로 되돌리는 실수가 나기 쉬움(4개 기능 중 유일하게 "재계산되는 값"과 "수동 보존되는 값"이 한 테이블에 공존) → upsert 시 `is_paid`를 명시적으로 conflict 대상에서 제외
- **금액 계산 정밀도**: 1/N 분할 시 나눗셈 나머지 처리(반올림 규칙)를 명확히 정하지 않으면 총합이 원금액과 어긋날 수 있음 → 반올림 규칙을 구현 시 확정하고 완료 기준 체크리스트에 합계 검증 추가

---

### Phase 6: 통합 QA · 배포 · 문서화

**목표**: 4개 기능(모임/참여자/공지/카풀/정산)이 한 사용자 여정 안에서 함께 동작함을 확인하고 배포한다.

#### 핵심 기능

- [x] PRD의 사용자 여정(주최자 경로/참여자 경로) 전체를 실제로 한 번씩 수동으로 실행 — `MUST`
- [x] `mcp__supabase__get_advisors`로 전체 테이블 RLS/보안 자문 점검 — `MUST`
- [x] 반응형(모바일/데스크톱) 레이아웃 점검 — `SHOULD` (UX-1~5 단계에서 하단 nav·터치 타겟 등 이미 구현·확인됨; 이번 세션에서는 브라우저 창 리사이즈 도구가 이 환경에서 실제로 뷰포트를 바꾸지 못해 재확인은 못 함)
- [ ] Vercel 배포(마이그레이션 원격 프로젝트 적용 포함) — `MUST` (다음 세션으로 보류)

#### 기술적 준비 작업

- [x] 원격 Supabase 프로젝트에 `supabase/migrations` 전체 적용 확인 (모든 마이그레이션을 `apply_migration`으로 원격에 직접 적용해왔으므로 항상 동기화된 상태)
- [ ] 환경 변수(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) 배포 환경 설정 확인 (배포 보류로 함께 보류)

#### 예상 완료 결과물

- 배포된 프로덕션 URL에서 PRD 사용자 여정 전체가 동작
- `docs/guides/*`, `CLAUDE.md`에 신규 라우트/RHF+Zod 폼 패턴/`supabase/migrations` 컨벤션 반영

#### 완료 기준(체크리스트)

- [x] 주최자 경로(모임 생성 → 공지 → 참여자 승인 → 카풀 등록 → 비용 등록 → 정산 완료 체크) 전체 통과 (실 브라우저로 하나의 모임에서 연속 수행)
- [x] 참여자 경로(모임 조회 → 참여 신청 → 승인 대기/확인 → 카풀 좌석 신청 → 정산 금액 확인) 전체 통과 (테스트 계정 로그인이 불가해 참여 신청/좌석 신청은 SQL로 시뮬레이션하고, 승인·확정·분담액 반영은 호스트 화면 실제 클릭과 참여자 권한의 RLS 시뮬레이션 조회로 교차 검증)
- [x] `get_advisors` 점검에서 발견된 항목 조치 완료 또는 의도적 예외로 기록 (FK 인덱스 누락 10건은 마이그레이션으로 조치; `auth_rls_initplan`/`multiple_permissive_policies`는 `docs/issue.md` #3에 의도적 예외로 기록 — 전체 정책 rewrite의 리스크가 현재 규모의 성능 이득보다 크다고 판단)
- [ ] 프로덕션 배포 후 실제 URL에서 위 두 경로 재확인 (배포 보류로 함께 보류)
- [x] `docs/guides/*`, `CLAUDE.md` 최신화 완료

#### 위험 요소

- **테스트 프레임워크 부재**: 자동 회귀 테스트 없이 수동 QA에 의존 → 이 페이즈의 체크리스트가 사실상 유일한 회귀 방지망이므로 생략하지 않고 매 배포 전 반복 실행할 것을 권장(향후 정산 1/N 계산·카풀 초과 차단처럼 순수 계산 로직만이라도 Vitest로 단위 테스트화하는 것을 후속 과제로 고려)
- **스코프 크리프**: PRD가 4개 기능 모두 "얕게"를 명시했으므로, 통합 QA 중 발견된 개선 아이디어는 이번 MVP 범위에 바로 추가하지 않고 별도 backlog로 분리

### Phase 7: 운영 개선사항 (Phase 6 이후 추가 요청)

**목표**: MVP 기능 완성 후, 배포 전 운영 관점에서 필요한 개선사항 3건을 반영한다 — 관리자 부트스트랩, 회원가입/로그인 에러 처리 보강, 모임 커버 이미지 Storage 업로드.

#### 핵심 기능

- [x] 관리자 부트스트랩 SQL 스크립트(`supabase/bootstrap-admin.sql`) 추가 — `set_user_role` RPC가 호출자 admin을 요구해 admin이 한 명도 없는 새 환경에서 첫 admin을 만들 수 없는 문제 해결 — `MUST`
- [x] 회원가입 중복 이메일 처리 보강 — `error.code === "user_already_exists"` 및 `identities` 빈 배열(위장 성공 응답) 두 경로 모두 감지해 안내 — `MUST`
- [x] 로그인 미확인 이메일 처리 보강 — `error.code === "email_not_confirmed"` 감지 + 인증 메일 재전송 버튼 — `MUST`
- [x] "내 모임 > 참여한 모임" 커버 이미지 미표시 버그 수정(쿼리 select 누락 + 컴포넌트에 렌더링 자체가 없던 문제) — `MUST`
- [x] Supabase Storage 공개 버킷(`event-covers`, 5MB, image/\* 제한) + RLS 정책(본인 폴더만 업로드, 공개 조회) 추가 — `MUST`
- [x] 모임 생성/수정 폼에 커버 이미지 파일 업로드 UI 추가(기존 URL 직접 입력 방식과 병행, 업로드 결과가 동일 필드로 수렴) — `MUST`

#### 완료 기준(체크리스트)

- [x] `npm run lint`, `npm run typecheck`, `npm run build`가 매 태스크마다 통과
- [x] `get_advisors` 점검에서 새로운 경고 없음(FK 인덱스·Storage 버킷 권한 관련)
- [x] SQL 트랜잭션 시뮬레이션으로 Storage RLS 4가지 케이스(본인 폴더 업로드 성공/타인 폴더 업로드 차단/공개 조회 성공/anon 업로드 차단) 모두 확인
- [x] 실제 브라우저로 "내 모임" 참여한 모임 목록에 커버 이미지가 정상 표시됨을 확인

**✅ 완료** — shrimp-task-manager로 6개 원자적 태스크(관리자 부트스트랩, 회원가입 보강, 로그인 보강, 내 모임 버그 수정, Storage 버킷/RLS, 폼 업로드 UI 연동)로 분해해 순차 실행, 각 태스크를 `verify_task`로 검증. 커밋 3건(`0e70744` 관리자 부트스트랩, `0b89a8e` 회원가입/로그인 보강, `45c07da` 커버 이미지 Storage + 버그 수정)으로 분리. Supabase 공식 문서(`search_docs`)와 설치된 `@supabase/auth-js` 소스(`node_modules`)를 직접 확인해 에러 코드(`user_already_exists`, `email_not_confirmed`)와 Storage RLS 정책 문법(`(storage.foldername(name))[1] = auth.uid()::text`)의 정확성을 검증한 뒤 구현.

#### 위험 요소

- **"Confirm email" 대시보드 설정 미확인**: 이 설정은 코드나 MCP 도구로 조회할 수 없어, 회원가입 시 `user_already_exists` 에러 경로와 `identities` 빈 배열(위장 성공) 경로 중 실제로 어느 쪽이 발동하는지는 코드 리뷰로만 검증했다 — 계정 생성 금지 규칙상 실제 가입/로그인 시도를 할 수 없어 최종 동작 확인은 사용자가 직접 브라우저에서 테스트해야 한다.
- **Storage 고아 파일**: `event-covers` 버킷에 UPDATE/DELETE 정책을 의도적으로 두지 않아, 커버 이미지를 교체해도 이전 업로드 파일이 정리되지 않고 영구히 남는다(MVP 범위 제외, 후속 과제로 남김).
- **실제 파일 업로드 미검증**: `event-form.tsx`의 파일 업로드 UI는 정적 검증(lint/typecheck/build)과 Storage RLS SQL 시뮬레이션까지만 확인했고, 실제 브라우저에서 `<input type="file">` 업로드 자체는 시도하지 않았다 — 필요 시 별도로 진행.

---

### Phase 8: 버그 수정 및 커버 이미지 UX 개선 (Phase 7 이후 실사용 피드백)

**목표**: Phase 7 배포 전 실사용 중 발견된 버그 3건과, 그 과정에서 드러난 커버 이미지 UX 문제를 개선한다.

#### 핵심 기능

- [x] 숫자 입력 필드(정원/카풀 좌석 수/정산 금액) NaN 콘솔 에러 수정 — 필드를 비우면 `valueAsNumber`가 `NaN`이 되어 그대로 `value`에 전달되며 React 경고가 발생하던 문제. 표시값만 빈 문자열로 대체하고 `onChange`는 그대로 두어 zod가 빈 값을 검증 에러로 정상 처리하도록 함 — `MUST`
- [x] 커버 이미지 로드 실패 시 깨진 이미지 대신 플레이스홀더로 자동 대체(`onError` 처리, `EventCard`/`JoinedEventRow`) — `MUST`
- [x] 취소된 모임을 `/events`(모임 목록), `/my`(주최한 모임·참여한 모임)에서 숨김 — carpool/settlement/참여자 이력이 `on delete cascade`로 취소된 모임을 참조하고 있어 실제 삭제 대신 조회 쿼리에서 `status='cancelled'`를 제외하는 방식으로 처리(관련 데이터 보존) — `MUST`
- [x] 모임 생성/수정 폼에 커버 이미지 URL 실시간 미리보기/검증 추가 — URL 입력 500ms 디바운스 후 실제 로드 가능 여부를 즉시 확인해 미리보기 또는 경고 문구 표시(저장 후 목록에서야 깨진 URL임을 알게 되던 문제 해결). 파일 업로드 경로도 동일 미리보기를 공유 — `SHOULD`
- [x] 모임 카드 커버 이미지 `object-cover` → `object-contain`(+배경색)으로 교체 — 카드 비율과 이미지 비율이 다르면 이미지 일부만 보이던 문제를 이미지 전체가 항상 보이도록 수정(비율 불일치 시 상하 여백 발생) — `SHOULD`

#### 완료 기준(체크리스트)

- [x] `npm run lint`, `npm run build`(타입체크 포함)가 매 커밋 전 통과
- [x] Supabase에서 실제 DB 데이터를 조회·`curl`로 직접 확인해 "모임목록 이미지 미표시" 신고의 근본 원인이 코드가 아니라 유효하지 않은 이미지 URL(Pixabay 다운로드 페이지 URL, Cloudflare 봇 차단 403)임을 검증
- [x] 실제 브라우저(claude-in-chrome)로 커버 이미지 URL 미리보기의 성공/실패 케이스, 취소된 모임 숨김, object-contain 렌더링을 각각 확인

**✅ 완료** — 커밋 4건(`168cb81` NaN·이미지 로드 실패 수정, `7a3632d` 취소된 모임 숨김, `aa8fce1` URL 실시간 미리보기, `6136854` object-contain 전환)으로 분리. "커버 이미지가 안 보인다"는 반복 신고의 실제 원인이 코드 버그가 아니라 유효하지 않은 URL(Pixabay 다운로드 페이지 링크)이었음을 `curl`로 직접 검증한 뒤, 근본 해결책으로 폼 단계 실시간 검증을 추가— 재발 방지에 집중.

#### 위험 요소

- **취소된 모임 삭제 vs 숨김 해석 차이**: 사용자 요청 문구("완전히 삭제되도록")를 문자 그대로 하드 삭제로 해석하면 `event_participants`/`announcements`/`carpools`/`settlements` 등 연쇄 삭제로 관련 이력이 영구히 사라진다. 되돌릴 수 없는 결과를 피하기 위해 조회 단계에서 숨기는 방식으로 구현했다 — 사용자가 실제 하드 삭제를 원했다면 별도 확인 후 재작업 필요.
- **Storage 고아 파일 미해결**: Phase 7에서 남긴 이슈(업로드한 파일을 교체해도 이전 파일이 정리되지 않음)는 이번 페이즈에서도 다루지 않았다.

---

### Phase 9: 초대 링크 · 모바일 레이아웃 · 참여자 목록 (실사용 신규 요청)

**목표**: (1) 모임 URL 공유 시 로그인 상태와 무관하게 최종적으로 모임 상세 페이지에 도달하는 초대 링크 딥링크, (2) 일반 데스크톱 브라우저 창에서도 모바일 레이아웃이 더 넓은 범위에서 노출되도록 반응형 전환 기준 상향, (3) 모임 상세 페이지에서 승인된 참여자 전원을 조회할 수 있는 목록 UI를 구현한다. shrimp-task-manager로 9개 원자적 태스크(`analyze_task`→`reflect_task`→`split_tasks`)로 분해해 순차 실행한다.

#### 핵심 기능 — 기능 1: 초대 링크 딥링크(`next` 파라미터 체이닝)

- [x] `proxy.ts` 미인증 리다이렉트 시 목적지(`pathname+search`)를 `next` 쿼리로 보존 — `MUST`
- [x] Google OAuth 버튼(`google-signin-button.tsx`)에 `next` 파라미터 전달 — `MUST`
- [x] 로그인 폼(`login-form.tsx`) `next` 파라미터 소비(로그인 성공 시 `next`로 이동) 및 회원가입 링크·Google 버튼에 전달, `/auth/login` 페이지 Suspense 처리 — `MUST`
- [x] 회원가입 폼(`sign-up-form.tsx`) `next` 파라미터 소비(`emailRedirectTo`에 포함, 세션 즉시 발급 시 바로 이동) 및 로그인 링크·Google 버튼에 전달, `/auth/sign-up` 페이지 Suspense 처리 — `MUST`

`app/auth/callback/route.ts`, `app/auth/confirm/route.ts`는 이미 `next`를 읽어 `redirect(next)`하는 로직을 갖추고 있어(Supabase 스타터 보일러플레이트) 변경하지 않는다. open-redirect 방지(`next`가 `/`로 시작하지 않거나 `//`로 시작하면 `/`로 폴백)를 `proxy.ts`/`login-form.tsx`/`sign-up-form.tsx` 세 곳에 동일 적용.

#### 핵심 기능 — 기능 2: 모바일 레이아웃 브레이크포인트 상향(640px → 1024px)

- [x] 네비게이션(`main-nav.tsx`/`bottom-nav.tsx`) 레이아웃 전환용 `sm:` → `lg:` 치환 — `MUST`
- [x] 페이지 그리드/탭 터치타겟(`app/page.tsx`, `app/events/page.tsx`, `app/my/page.tsx`, `app/admin/page.tsx`, `app/profile/page.tsx`, `app/events/[id]/page.tsx`) `sm:` → `lg:` 치환 — `MUST`
- [x] 레이아웃 하단 여백(4개 `layout.tsx`) `sm:pb-5` → `lg:pb-5` 치환 — `MUST`

1024px는 Tailwind v4 기본 브레이크포인트 `lg`와 일치해 커스텀 브레이크포인트 정의가 불필요함을 확인. 버튼 size variant, shadcn dialog 반응형, 랜딩 히어로 텍스트 스케일링처럼 레이아웃 모드 전환과 무관한 `sm:`는 변경하지 않는다.

#### 핵심 기능 — 기능 3: 모임 참여자 목록 표시

- [x] `event_participants`에 `status='approved'` 행을 인증된 모든 사용자에게 공개하는 신규 RLS SELECT 정책 마이그레이션 추가 — `MUST`
- [x] 참여자 탭에 승인된 참여자 전원을 아바타+이름으로 나열하는 신규 섹션 추가(호스트 관리 영역과 별도, `event-card.tsx`의 Avatar 패턴 재사용, 정산 탭이 쓰는 기존 쿼리에 `avatar_url`만 추가해 재사용) — `MUST`

프로필 연결(`/profile/[id]`)은 이번 스코프에서 제외하되 `userId`를 데이터에 포함해 향후 링크 추가를 쉽게 해둔다.

#### 완료 기준(체크리스트)

- [x] `npm run lint`, `npm run build`가 매 태스크마다 통과
- [x] `mcp__supabase__get_advisors` 점검에서 새 경고 없음(기존 무관 경고만 존재)
- [x] RLS SQL 트랜잭션 시뮬레이션으로 승인된 참여자가 타인에게도 조회되는지 확인(계정 생성/로그인 없이 검증) — 참여 신청조차 없는 완전한 제3자가 `approved` 행은 조회되고 `pending` 행은 조회되지 않음을 확인
- [x] 실제 브라우저(claude-in-chrome)로 900px/1024px 경계, 참여자 목록 빈 상태 렌더링 확인(iframe 폭 시뮬레이션으로 하단 탭바 전환 재확인)
- [x] 초대 링크 흐름은 실제 로그인 시도 없이 코드 리뷰로 `next` 파라미터 전달 체인 검증(실제 가입/로그인 최종 확인은 사용자 본인이 브라우저로 수행 필요)

**✅ 완료** — shrimp-task-manager로 9개 원자적 태스크로 분해해 순차 실행(`6f6e54f2`~`c41a1a7a`), 각 태스크를 `verify_task`로 검증. 커밋 3건(`41cac06` 초대 링크, `d9d8a5f` 모바일 브레이크포인트, 참여자 목록 커밋은 아래 참고)으로 분리. RLS 정책은 실제 `apply_migration`으로 적용 후 `list_migrations`로 확인한 버전(`20260814163310`)으로 로컬 파일 저장, 추측 없이 진행.

#### 위험 요소

- **이메일 확인 템플릿은 코드 밖 설정**: Supabase 대시보드의 "Confirm signup" 이메일 템플릿이 `next`를 실어 나르는 링크 형식이 아니면, 이메일 인증 경로에서 `next`가 유실되고 `/auth/confirm`의 기본값(`"/"`)으로 떨어질 수 있다. Google OAuth 경로는 이 문제가 없다. 실제 대시보드 설정 확인은 사용자가 직접 해야 한다.
- **브레이크포인트 상향에 따른 UX 변화**: 640~1023px 구간(예: 태블릿 세로모드) 사용자에게는 기존에 데스크톱으로 보이던 화면이 이제 모바일 레이아웃으로 바뀐다 — 사용자가 명시적으로 선택한 트레이드오프.
- **참여자 목록 공개 범위**: `status='approved'` 참여자는 다른 모임의 참여자에게도 조회 가능하도록 인증된 모든 사용자에게 공개했다(사용자가 명시적으로 선택) — 같은 모임 참여자로 제한하는 더 엄격한 정책은 이번 스코프에서 채택하지 않음.

---

### Phase 10: 회원 탈퇴(계정 삭제) 기능 추가

**목표**: 프로필 페이지에 회원 탈퇴 기능이 없다는 신고와, "Supabase 대시보드에서 `profiles` 테이블 행을 삭제해도 로그인이 된다"는 신고 두 건을 동시에 해결한다. 조사 결과 후자는 버그가 아니라 `public.profiles.id → auth.users(id) on delete cascade`(자식→부모 방향)라는 PostgreSQL FK 의미론과, Supabase Auth가 `public.profiles`가 아닌 `auth.users`만으로 인증을 검증하는 아키텍처상 당연한 동작임을 실제 DB 트리거(`pg_trigger`) 조회와 공식 문서(`search_docs`)로 확정했다. 즉 회원 탈퇴 기능(계정 자체 삭제)을 올바르게 구현하는 것이 두 문제 모두의 해결책이다. shrimp-task-manager로 5개 원자적 태스크(`analyze_task`→`reflect_task`→`split_tasks`)로 분해해 순차 실행한다.

#### 핵심 기능

- [x] `SUPABASE_SERVICE_ROLE_KEY` 환경변수 확인(값은 절대 읽지 않고 존재 여부만 확인, 없으면 사용자가 `.env.local`에 직접 추가) — `MUST`
- [x] 서버 전용 admin 클라이언트 신설(`lib/supabase/admin.ts`, `@supabase/supabase-js`의 `createClient`를 service_role 키로 초기화, 클라이언트 컴포넌트에서 import 금지) — `MUST`
- [x] 회원 탈퇴 Server Action(`app/profile/actions.ts`의 `deleteAccount()`) — 현재 세션 확인 → `admin.auth.admin.deleteUser(userId)` 호출 → 성공 시 `signOut()` + `/auth/login` 리다이렉트 — `MUST`
- [x] 회원 탈퇴 확인 UI(`components/delete-account-button.tsx`) — `event-info-tab.tsx`의 기존 "모임 취소" Dialog 패턴 재사용, "본인이 만든 모임과 참여 내역이 모두 함께 삭제됨" 경고 문구 포함, `app/profile/page.tsx`의 `<LogoutButton />` 아래 배치 — `MUST`
- [x] `auth.users` 삭제 시 `profiles`/`events`/`event_participants`/`carpools`/`settlements` 전체 체인이 cascade 삭제되는지 SQL 트랜잭션(rollback) 시뮬레이션으로 검증 — `MUST`

새 마이그레이션이나 `database.types.ts` 변경은 필요 없다(기존 `on delete cascade` FK 체인이 이미 전 테이블에 존재함을 사전 조사로 확인).

#### 완료 기준(체크리스트)

- [x] `npm run lint`, `npm run build`가 매 태스크마다 통과
- [x] SQL 트랜잭션 rollback 시뮬레이션으로 cascade 삭제 체인 확인(실제 데이터 손상 없음) — 실제 admin 계정(호스트 이벤트 3개)으로 시뮬레이션해 profiles/events가 모두 cascade 삭제됨을 확인 후 rollback으로 완전 복원 재확인
- [x] 실제 브라우저(claude-in-chrome)로 탈퇴 확인 다이얼로그의 열기/경고 문구/취소 동작 확인(실제 확정 클릭은 사용자 승인 없이 수행하지 않음)
- [x] `mcp__supabase__get_advisors` 점검에서 새 경고 없음(기존 무관 경고만 존재)

**✅ 완료** — shrimp-task-manager로 5개 원자적 태스크로 분해해 순차 실행(`f3d38a45`~`6116e432`), 각 태스크를 `verify_task`로 검증. 커밋 1건(`408ca07`)으로 처리. 검증 과정에서 실제 DB 상태가 사용자가 신고한 "문제 2"를 그대로 재현하고 있음을 추가로 발견했다 — `ljohyun7@naver.com` 계정이 `auth.users`엔 존재하지만 `public.profiles`는 이미 삭제된 상태였고, 이 계정을 참조하던 `event_participants`/`carpools`/`settlements` 등도 이미 `profiles`의 cascade로 함께 정리되어 있었다. 이는 근본 원인 분석(스키마/트리거 조사)이 실제 데이터로도 뒷받침됨을 보여준다.

**후속 실사용 검증(2026-08-14)** — `SUPABASE_SERVICE_ROLE_KEY`를 사용자가 `.env.local`에 추가한 뒤(최초 `NEXT_PUBLIC_` 접두사로 잘못 추가했던 것을 즉시 정정, `docs/issue.md` #4 참고), 실제 로그인된 고아 계정(`ljohyun7@naver.com`)으로 "회원 탈퇴 → 탈퇴 확정" 버튼을 실제로 클릭해 end-to-end 검증을 완료했다. `/auth/login`으로 정상 리다이렉트됐고, SQL로 `auth.users`/`profiles`/`sessions` 모두 0건임을 확인해 완전 삭제를 실증했다. 이후 같은 이메일로 재가입 → 이메일 확인 → 재로그인까지 사용자가 직접 수행해 전체 회원가입/탈퇴 사이클이 실사용 환경에서 정상 동작함을 최종 확인했다(이메일 확인 링크를 중복 클릭해 "만료됨" 에러가 잠깐 떴으나, Auth 로그 조회로 1회용 토큰의 정상 동작이며 첫 클릭에서 이미 확인이 성공했음을 규명 — `docs/issue.md` #5 참고).

#### 위험 요소

- **`service_role` 키 노출 위험**: RLS를 완전히 우회하는 최고 권한 키이므로 `lib/supabase/admin.ts`는 반드시 Server Action에서만 import해야 하며, 클라이언트 컴포넌트나 브라우저 번들에 포함되지 않도록 각별히 주의한다. 실제로 `.env.local`에 `NEXT_PUBLIC_` 접두사로 잘못 추가됐던 near-miss가 있었다(즉시 발견해 정정, 실제 노출은 없었음).
- **다른 기기의 기존 세션**: Supabase 문서에 따르면 `auth.users` 삭제 후에도 이미 발급된 JWT는 만료 전까지 유효할 수 있다 — 탈퇴를 시작한 현재 브라우저는 `signOut()`으로 즉시 정리되지만, 다른 기기에 남아있던 이전 세션까지 즉시 무효화하는 것은 이번 스코프 밖이다.

---

### Phase 11: 닉네임 설정 플로우 · 프로필 편집 기능 추가 (실사용 신규 요청)

**목표**: `profiles.username`이 컬럼만 있고 어디서도 설정/편집되지 않는 죽은 필드인 문제를 해결한다. (1) 회원가입(이메일/Google OAuth) 완료 직후 닉네임을 반드시 설정하게 하고, OAuth 가입자는 계정 이름을 기본값으로 프리필한다. (2) `/profile`에서 이름/닉네임/자기소개/웹사이트/아바타를 자유롭게 수정할 수 있는 편집 기능을 추가한다. shrimp-task-manager로 9개 원자적 태스크(`plan_task`→`analyze_task`→`reflect_task`→`split_tasks`)로 분해해 순차 실행한다.

#### 핵심 기능 — 기능 1: 닉네임 강제 설정

- [x] `lib/validations/profile.ts` 신설 — `usernameSchema`(3~20자, 영문/숫자/밑줄, 빈 문자열 허용)를 단독 정의하고 `nicknameFormSchema`/`profileFormSchema`가 공유 — `MUST`
- [x] `lib/supabase/proxy.ts` 인증 가드 확장 — 로그인 상태에서 `profiles.username`이 NULL이면 `/auth/nickname?next=`으로 리다이렉트 — `MUST`
- [x] `app/auth/nickname/actions.ts`(`setNickname`) — 23505(중복) 처리(`app/events/[id]/participants-actions.ts` 패턴 재사용) — `MUST`
- [x] `components/auth/nickname-form.tsx` — RHF+zod, username 단일 필드, OAuth 가입자는 `profiles.full_name`(트리거가 이미 채워둔 값)을 기본값으로 프리필 — `MUST`
- [x] `app/auth/nickname/page.tsx` — Server Component, 완료 후 `next` 파라미터로 원래 목적지 복귀 — `MUST`

훅 지점은 이메일/OAuth 콜백을 개별로 건드리지 않고 `lib/supabase/proxy.ts`의 인증 가드 한 곳에서 처리했다 — 두 가입 경로 모두 결국 보호된 페이지를 거치므로 이 지점만 확장하면 충분하고 로직이 한 곳에 모인다. `handle_new_user()` 트리거는 수정하지 않았다(username은 트리거로 채울 수 없는 사용자 입력값). 기존 사용자 중 username이 NULL인 계정도 다음 보호 경로 접근 시 자연스럽게 요구받으므로 별도 백필은 하지 않았다. 계획 단계에서는 "화이트리스트에 `/auth/nickname` 추가"를 별도 작업으로 상정했으나, 구현 중 확인한 결과 기존 `!pathname.startsWith("/auth")` 예외가 `/auth/nickname`도 이미 포괄하고 있어 별도 코드 추가 없이 무한루프가 방지됨을 확인했다.

#### 핵심 기능 — 기능 2: 프로필 편집

- [x] `supabase/migrations/20260818224559_create_avatars_storage_bucket.sql` — 아바타 업로드용 public 버킷(2MB, image/\* 제한), `{auth.uid()}/{filename}` 경로만 INSERT 허용, UPDATE/DELETE 정책 없음(event-covers와 동일하게 MVP 범위 외) — `MUST`
- [x] `app/profile/actions.ts`에 `updateProfile()` 추가 — 빈 문자열 필드는 `null`로 정규화, 23505 처리 — `MUST`
- [x] `components/profile/profile-edit-form.tsx` — RHF+zod+Storage 직접 업로드(`components/events/event-form.tsx` 패턴 재사용) — `MUST`
- [x] `app/profile/edit/page.tsx` 신설, `Suspense` 래핑(`app/events/[id]/edit/page.tsx` 패턴) — `MUST`
- [x] `app/profile/page.tsx`에 "편집" 버튼 추가(조회 select문은 그대로 유지) — `MUST`

진입 UX는 별도 `/profile/edit` 페이지(Dialog/인라인 아님)로 결정 — `app/events/[id]/edit/page.tsx` 선례와 일관되고, 조회 페이지에 폼 상태를 얹지 않아도 되어 구현 비용이 낮다.

#### 완료 기준(체크리스트)

- [x] `npm run lint`, `npm run build`가 매 태스크마다 통과
- [x] `mcp__supabase__get_advisors`로 신규 정책 보안 점검 — 새 경고 없음(기존 무관 경고 5건만 존재)
- [x] SQL 트랜잭션 시뮬레이션(rollback)으로 `avatars` 버킷 RLS 3가지 케이스(본인 폴더 업로드 성공/타인 폴더 업로드 차단/공개 조회 성공) 확인
- [x] 이메일 가입 → 닉네임 설정 페이지로 강제 이동 → 저장 → 원래 목적지로 복귀 확인
- [x] `/profile` → 편집 → 각 필드 수정 후 저장, 아바타 업로드 → Storage에 `{uid}/...` 경로로 저장 확인
- [x] 중복 username 저장 시 에러 메시지 확인
- [ ] Google 가입 → 닉네임 필드에 계정 이름이 기본값으로 채워지는지 확인 (OAuth 로그인은 브라우저 동의 화면을 거쳐야 해 자동화 불가, 이메일 가입 계정으로는 `toUsernameCandidate()` 로직만 코드로 검증)

**✅ 완료 — 실제 브라우저(playwright MCP) end-to-end 검증까지 통과.** shrimp-task-manager로 9개 원자적 태스크로 분해해 순차 실행, 각 태스크를 `verify_task`로 검증. 구현 중 계획에 없던 이슈 2건을 발견해 수정: (1) `/auth/nickname/page.tsx`에서 `searchParams`를 `Suspense` 경계 밖(default export)에서 `await`하면 Next.js 16 Cache Components의 "Blocking Route" 에러로 빌드가 실패함을 확인 — `app/events/[id]/edit/page.tsx`처럼 `searchParams` Promise를 그대로 하위 Server Component에 넘기고 그 안에서 `await`하도록 수정. (2) OAuth `full_name`(예: "홍길동", 공백/한글 포함)을 닉네임 기본값으로 그대로 프리필하면 `usernameSchema` 정규식(영문/숫자/밑줄)에 걸려 대부분의 한국어 이름 사용자가 제출 시 항상 검증 실패했을 것 — `toUsernameCandidate()` 헬퍼로 정제 후 3자 미만이면 빈 문자열로 폴백.

**실사용 브라우저 검증(2026-08-19, playwright MCP, 테스트 계정 `vibecoding@gmail.com`)** — 코드 정적 검증 이후 사용자 요청으로 실제 회원가입부터 재검증했고, 그 과정에서 정적 검증만으로는 잡지 못한 런타임 버그 1건을 추가로 발견해 수정했다: `app/auth/nickname/page.tsx`가 `onSubmitAction={(values) => setNickname(values, next)}`처럼 인라인 화살표 함수를 Server Component에서 Client Component(`NicknameForm`) prop으로 넘기고 있었는데, Next.js는 Server Action 참조(`.bind()`로 인자를 미리 채운 함수)만 경계를 넘길 수 있고 임의의 클로저는 직렬화할 수 없어 `/auth/nickname` 진입 시 100% 런타임 에러가 발생했다("Event handlers cannot be passed to Client Component props"). `event-form.tsx`가 `onSubmitAction={updateEvent.bind(null, id)}` 형태로 이미 이 제약을 우회하고 있었다는 걸 뒤늦게 인지 — `setNickname`의 인자 순서를 `(values, next)`에서 `(next, values)`로 바꿔 `setNickname.bind(null, next)`로 넘기도록 수정했다(빌드/타입체크는 이 문제를 잡지 못하고 런타임에만 드러남).
전체 시나리오: 회원가입(이메일 미확인 상태를 SQL로 직접 `email_confirmed_at` 갱신해 우회) → 로그인 → 보호 경로(`/events`) 접근 시 `/auth/nickname?next=%2Fevents`로 강제 리다이렉트 확인 → 닉네임 `vibecoding` 저장 후 `/events`로 정상 복귀 → `/profile/edit`에서 이름/닉네임/자기소개/웹사이트 텍스트 필드와 실제 이미지 파일 업로드(아바타)까지 저장 → DB(`profiles` 테이블) 조회로 5개 필드 전부와 Storage 경로(`avatars/{uid}/{timestamp}-{filename}`)가 정확히 반영됨을 확인 → 두 번째 테스트 계정(`vibecoding2@gmail.com`)으로 동일 닉네임 `vibecoding` 설정 시도 시 "이미 사용 중인 아이디입니다" 에러가 실제로 노출됨을 확인. 콘솔 에러 0건(버그 수정 이후).

#### 위험 요소

- **기존 로그인 세션 영향**: 가드를 배포하는 즉시, username이 NULL인 기존 로그인 사용자는 다음 페이지 이동 시 닉네임 설정을 강제로 요구받는다 — 의도된 동작이지만 갑작스러운 흐름 변경으로 인지될 수 있다.
- **Storage 고아 파일**: `avatars` 버킷도 `event-covers`와 동일하게 UPDATE/DELETE 정책을 두지 않아, 아바타를 교체해도 이전 파일이 정리되지 않는다(MVP 범위 제외, 후속 과제로 남김).
- **이메일 확인 템플릿 경유 시 next 유실 가능성**: Phase 9에서 이미 확인된 동일 제약 — Supabase 대시보드의 이메일 템플릿이 `next`를 실어 나르지 않으면 닉네임 설정 후 원래 목적지가 아닌 `/`로 이동할 수 있다.

---

## 주요 마일스톤

| 마일스톤                                       | 완료 기준                                                                             | 핵심 산출물                                                                        | 상태    |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------- |
| M0. 앱 골격 완성                               | Phase 0 완료 기준 충족                                                                | 전체 라우트/네비게이션/탭 구조(mock 데이터)                                        | ✅ 완료 |
| M1. 모임 골격 동작                             | Phase 1 완료 기준 충족                                                                | 모임 생성/목록/상세/수정/취소 실 데이터 연동                                       | ✅ 완료 |
| M2. 참여자 관리 동작                           | Phase 2 완료 기준 충족                                                                | 참여 신청/승인/거절/취소, 내 모임 페이지 실 데이터 연동                            | ✅ 완료 |
| M2.5. UI/UX 개선 완료                          | [UI/UX 로드맵](./gathering-event-mvp-ui-ux-roadmap.md) Phase UX-1~UX-5 완료 기준 충족 | 랜딩 리뉴얼, 카드형 목록, 프로필 페이지, 반응형 하단 nav                           | ✅ 완료 |
| M3. 공지 동작                                  | Phase 3 완료 기준 충족                                                                | 공지 작성/목록 실 데이터 연동                                                      | ✅ 완료 |
| M4. 카풀 동작                                  | Phase 4 완료 기준 충족                                                                | 카풀 등록/좌석 신청/확정(하드 블록) 실 데이터 연동                                 | ✅ 완료 |
| M5. 정산 동작                                  | Phase 5 완료 기준 충족                                                                | 비용 항목 등록/1·N 분담/정산 완료 체크 실 데이터 연동                              | ✅ 완료 |
| M6. MVP 배포 완료                              | Phase 6 완료 기준 충족                                                                | 프로덕션 배포 + 통합 QA 통과 + 문서화 반영                                         | ⬜ 대기 |
| M7. 운영 개선사항 완료                         | Phase 7 완료 기준 충족                                                                | 관리자 부트스트랩, 회원가입/로그인 에러 처리 보강, 모임 커버 이미지 Storage 업로드 | ✅ 완료 |
| M8. 버그 수정·이미지 UX 개선 완료              | Phase 8 완료 기준 충족                                                                | NaN 에러 수정, 취소된 모임 숨김, 커버 이미지 URL 실시간 검증, object-contain 전환  | ✅ 완료 |
| M9. 초대 링크·모바일 레이아웃·참여자 목록 완료 | Phase 9 완료 기준 충족                                                                | 초대 링크 `next` 딥링크, 브레이크포인트 1024px 상향, 승인된 참여자 목록 UI         | ✅ 완료 |
| M10. 회원 탈퇴 기능 완료                       | Phase 10 완료 기준 충족                                                               | service_role admin 클라이언트, `deleteAccount` Server Action, 탈퇴 확인 UI         | ✅ 완료 |
| M11. 닉네임 설정·프로필 편집 완료              | Phase 11 완료 기준 충족                                                               | 닉네임 강제 설정 플로우, avatars Storage 버킷, `/profile/edit` 프로필 편집 기능    | ✅ 완료 |

## 크로스컷팅 관심사(Cross-cutting Concerns)

### 테스팅 전략

- 이 저장소에는 테스트 프레임워크가 구성되어 있지 않다(Vitest/Jest 미설치). 이 로드맵에서는 자동화 테스트를 새로 구성하지 않고, 각 페이즈의 "완료 기준" 체크리스트를 수동 QA로 사용한다.
- 매 페이즈 공통 검증: `npm run lint`, `npm run typecheck`, `npm run build` 통과를 완료 기준에 포함(기존 CI가 동일 명령을 실행하므로 로컬에서 먼저 통과시켜 CI 실패를 예방).
- 경계값·계산 로직(카풀 초과 확정 차단, 정산 1/N 분할, `is_paid` 보존)은 특히 수동으로 "일부러 깨보는" 시나리오를 완료 기준에 명시했다(Phase 4, 5 참고).
- 후속 과제(이번 로드맵 범위 밖): 정산 1/N 계산, 카풀 초과 차단처럼 순수 함수로 분리 가능한 로직에 한해 Vitest 도입을 검토할 수 있음.

### 배포 계획

- Phase 0~5는 로컬(개발 Supabase 프로젝트) 기준으로 진행하고, Phase 6에서 원격 Supabase 프로젝트에 `supabase/migrations`를 일괄 적용한 뒤 Vercel에 배포한다.
- 마이그레이션은 각 기능 페이즈(1-B~5-B)에서 순차적으로 추가되므로, 원격 적용 시에도 동일한 순서(`events` → `event_participants` → `events.cover_image_url`(UI/UX 개선 페이즈) → `announcements` → `carpools`/`carpool_requests` → `settlements`/`settlement_shares` → FK 인덱스 보강 → `event-covers` Storage 버킷/RLS(Phase 7))로 쌓인 마이그레이션 파일을 그대로 적용하면 된다.
- 배포 후에는 `supabase/bootstrap-admin.sql`(Phase 7)을 프로덕션 Supabase 프로젝트에서 service_role 권한으로 1회 실행해 최초 admin 계정을 지정해야 한다(마이그레이션에 포함되지 않으므로 자동 적용되지 않음).

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
