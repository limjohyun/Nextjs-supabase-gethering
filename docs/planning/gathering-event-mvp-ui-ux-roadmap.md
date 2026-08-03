# 🎨 모임 이벤트 관리 웹 UI/UX 개선 로드맵

## 개요

- **목적**: 참고 앱 "Gather"(초대 링크 기반 소규모 이벤트 관리 플랫폼, 5~30명 규모)의 스크린샷 5장을 참고해, 지금까지 mock/기본 마크업 수준으로 만들어 둔 화면(랜딩·모임 목록·내 모임·모임 생성)의 시각적 완성도를 끌어올린다.
- **참고 이미지 5장과 관찰 포인트**
  1. **랜딩 페이지**: 브랜드 타이틀(`Gather,`) + 한 줄 태그라인 + 기능 3카드(간편한 이벤트 생성 / 원클릭 초대 시스템 / 실시간 참여자 관리) + "Google로 시작하기" CTA + 하단 캡션("5-30명 규모의 소규모 이벤트에 최적화된 플랫폼")
  2. **이벤트 생성 폼**: 제목 / 설명 / 장소 / 날짜 및 시간 / 커버 이미지 URL 입력 필드 + 취소·생성 버튼 2단 배치, 하단에 모바일 탭바(홈/이벤트/새이벤트/프로필)
  3. **"내 이벤트" 목록**: "내가 만든 이벤트" / "내가 참여한 이벤트" 두 섹션, 카드마다 커버 이미지 썸네일 + 상태 배지(예정/진행중/종료) + 제목 + 일시 + 주최자 아바타·이름 + 참여자 수 아이콘
  4. **프로필 페이지**: 아바타 + 이름 + 이메일, "만든 이벤트"/"참여한 이벤트" 통계 카드 2개, 계정 정보 카드(역할/가입일)
- **이 로드맵과 기존 로드맵의 관계**: [`gathering-event-mvp-roadmap.md`](./gathering-event-mvp-roadmap.md)의 **Phase 2 완료 후, Phase 3(공지) 착수 전**에 끼워 넣는 별도 페이즈 묶음이다. 완료되면 기존 로드맵 Phase 3부터 그대로 재개한다. 두 문서는 동일한 컨벤션(페이즈 게이트 방식, 기간 추정 없음, 구조 우선 원칙, `npm run lint/typecheck/build` + 브라우저 실사용 검증)을 공유한다.
- **디자인 시스템 재사용**: 이 저장소의 shadcn 설정(`components.json`: `style: new-york`, `baseColor: neutral`)과 `app/globals.css`의 흑백 중심 컬러 토큰은 참고 이미지의 미니멀 톤과 이미 거의 일치한다. **색상 체계를 새로 만들지 않는다** — 이번 로드맵은 컴포지션 패턴(카드 안에 이미지+배지+아바타 조합, 통계 카드, 하단 탭바)을 이식하는 데 집중한다.
- **카피 각색 원칙**: Gather는 "초대 링크 기반 일회성 이벤트" 서비스이고 우리 앱은 "로그인 기반 승인제 모임 관리" 서비스로 컨셉이 다르다. 문구를 그대로 베끼지 않고 우리 실제 기능(모임 생성·참여자 승인·공지 등)에 맞게 각색한다.

## 페이즈별 개발 계획

### Phase UX-1: 공통 디자인 토대

**목표**: 이후 페이즈(UX-3, UX-4)에서 반복 사용할 공통 컴포넌트·유틸을 먼저 준비한다. 이 페이즈 자체는 화면에 아직 노출되지 않는다.

#### 핵심 작업

- [x] `npx shadcn@latest add avatar`로 Avatar 컴포넌트 추가 — `MUST` (현재 `components/ui/`에 avatar 없음, `profiles.avatar_url` 컬럼은 이미 존재하므로 바로 활용 가능)
- [x] 이벤트 표시 상태 계산 유틸 신설: `lib/events/status.ts`의 `getEventDisplayStatus(eventDatetime, status)` — `MUST`
  - `status === 'cancelled'` → `"취소됨"`
  - `event_datetime`이 현재 시각보다 미래 → `"예정"`
  - 그 외(현재 시각보다 과거) → `"종료"`
- [x] 상태별 Badge variant 매핑 정의(예정=outline, 종료=secondary, 취소됨=destructive 등 기존 팔레트 재사용) — `MUST`
- [x] `EventInfoTab`(`components/events/event-info-tab.tsx`)의 기존 상태 표시(`status === "cancelled" ? "취소됨" : "모집 중"`)를 이 유틸로 교체해 중복 로직 제거 — `SHOULD`

**✅ Phase UX-1 완료** — ui-markup-specialist 에이전트로 3개 파일(components/ui/avatar.tsx, lib/events/status.ts, event-info-tab.tsx) 작업 후 브라우저에서 예정/종료/취소됨 3가지 상태를 실 데이터(테스트 이벤트 3건)로 직접 확인. npm run lint/typecheck/build 통과.

#### 설계 참고: 참고 이미지 대비 단순화 지점

참고 이미지는 예정/진행중/종료 3가지 상태를 쓰지만, 우리 `events` 테이블에는 종료 시각(`end_datetime`)이 없어 "지금 진행 중인지"를 판별할 수 없다. **이번 로드맵에서는 예정/종료/취소됨 3단계로 단순화**한다("진행중" 상태는 도입하지 않음). 추후 종료 시각 컬럼이 추가되면 재검토한다.

#### 예상 완료 결과물

- 이후 페이즈가 재사용할 `getEventDisplayStatus()` 유틸과 Avatar 컴포넌트가 준비된 상태

#### 완료 기준(체크리스트)

- [x] `getEventDisplayStatus()`가 미래/과거/취소 3가지 입력에 대해 올바른 문자열을 반환함(임시 테스트 페이지 또는 콘솔 로그로 육안 확인 — 테스트 프레임워크 없음)
- [x] `npm run lint`, `npm run typecheck` 통과

#### 위험 요소

- **상태 단순화에 대한 사용자 기대 불일치**: "진행중" 상태를 기대하는 사용자에게는 어색할 수 있음 → UX-3 완료 기준에도 3단계 단순화를 명시해 이후 리뷰에서 재확인

---

### Phase UX-2: 랜딩 페이지(`/`) 리뉴얼

**목표**: 스타터킷 튜토리얼 화면을 실제 제품 랜딩 페이지로 교체한다.

#### 핵심 작업

- [x] `app/page.tsx`에서 `Hero`, `ConnectSupabaseSteps`, `SignUpUserSteps` 렌더링을 제거하고 신규 랜딩 콘텐츠로 교체 — `MUST`
  - 서비스명 + 태그라인(예: "수영·헬스·친구모임의 공지·참여자·카풀·정산을 한 곳에서")
  - 기능 소개 카드 3개(실제 구현/예정 기능 기준: 모임 생성, 참여자 승인 관리, 공지·카풀·정산 — Gather의 "카톡 초대 링크" 카피는 우리 앱에 없는 기능이므로 그대로 쓰지 않음)
  - 로그인 CTA: 기존 `/auth/login`으로 연결(신규 로그인 로직 구현 없음, 기존 Google OAuth 버튼 재사용)
- [x] 로그인 상태 분기: 이미 로그인한 사용자가 `/`에 접근하면 CTA를 "모임 목록 보기"(`/events`로 이동)로 전환 — `MUST`
- [x] `hasEnvVars`가 false인 경우(env var 미설정) 기존 `EnvVarWarning` 안내는 보존 — `MUST` (배포 환경 방어 코드이므로 삭제하지 않음, `ConnectSupabaseSteps`/`SignUpUserSteps` 콘텐츠만 교체)

**✅ Phase UX-2 완료** — app/page.tsx를 서비스명+태그라인+기능 3카드+CTA 구조로 재작성. 로그인 여부는 `LandingCta` 서버 컴포넌트에서 `supabase.auth.getClaims()`로 판별해 `<Suspense>`로 감싸는 기존 패턴(app/events/page.tsx)을 재사용. 브라우저에서 로그아웃 상태("시작하기" CTA + 상단 Sign in/Sign up)와 로그인 상태("모임 목록 보기" CTA + "Hey, {email}!") 양쪽을 실제 로그아웃/로그인까지 수행하며 확인.

#### 예상 완료 결과물

- `/`가 스타터킷 튜토리얼이 아닌 실제 서비스 소개 화면으로 동작하고, 로그인 여부에 따라 CTA가 달라짐

#### 완료 기준(체크리스트)

- [x] 로그아웃 상태에서 `/` 접근 시 랜딩 콘텐츠 + 로그인 CTA 노출 확인(브라우저)
- [x] 로그인 상태에서 `/` 접근 시 "모임 목록 보기" CTA로 전환됨을 확인(브라우저)
- [x] 기존 `/auth/login`, `/auth/sign-up` 등 인증 플로우가 영향받지 않았는지 확인
- [x] `npm run lint`, `npm run typecheck`, `npm run build` 통과

#### 위험 요소

- **`hasEnvVars` 분기 삭제 실수**: env var 미설정 환경(신규 clone 등)에서 안내 없이 빈 화면이 뜰 위험 → `EnvVarWarning` 분기는 유지한 채 콘텐츠만 교체할 것

---

### Phase UX-3: 모임 카드/목록/내 모임 개선 — UI → 데이터 연동

**목표**: `EventCard`를 참고 이미지 스타일(커버 이미지+상태 배지+주최자 아바타+참여자 수)로 리디자인하고, `/events`·`/my` 양쪽에 적용한다.

#### 3-A. UI 먼저

- [x] `EventCard`(`components/events/event-card.tsx`) 레이아웃 개편: 상단 커버 이미지(값이 없으면 플레이스홀더), 상태 배지(UX-1의 `getEventDisplayStatus()` 사용), 제목, 일시, 주최자 아바타+이름, 참여자 수 아이콘(`capacity` 대비 표기 유지) — `MUST`
- [x] `app/my/page.tsx`의 "주최한 모임" 섹션도 단순 링크 목록에서 `EventCard` 재사용 형태로 통일(현재는 `/events`만 카드형, `/my`는 텍스트 목록) — `SHOULD`

**✅ Phase UX-3-A 완료** — ui-markup-specialist 에이전트로 구현. `EventCardData`에 `status`(필수)와 `coverImageUrl`/`hostName`/`hostAvatarUrl`(optional) 필드를 추가하고, 카드 최상단 커버 이미지 영역(값 없으면 `ImageIcon` 플레이스홀더), 카테고리+상태 배지, 아바타(fallback 포함)+주최자명, 참여자 수 아이콘을 구성. `/events`, `/my` "주최한 모임" 양쪽에서 동일 컴포넌트로 렌더링되는 것을 브라우저에서 확인(테스트 이벤트 생성 후 삭제). `<img>` 사용에 대한 `@next/next/no-img-element` 경고 1건은 임의 URL 커버 이미지를 다루는 의도적 선택으로 허용(다음 next/image 도메인 화이트리스트 불필요).

#### 3-B. 데이터 연동

- [x] `events` 테이블에 `cover_image_url text null` 컬럼 마이그레이션 추가(`supabase/migrations`) — `MUST`
- [x] `database.types.ts` 재생성 및 커밋 — `MUST`
- [x] `lib/validations/event.ts`에 `coverImageUrl`(선택, URL 형식) 필드 추가, `EventForm`에 "커버 이미지 URL" 입력 필드 추가(참고 이미지와 동일한 `https://example.com/image.jpg` placeholder) — `MUST`
- [x] `app/events/actions.ts`의 `createEvent`/`updateEvent`에 `cover_image_url` 반영 — `MUST`
- [x] `/events`·`/my` 목록 쿼리에 `event_participants` 조인/count를 추가해 `EventCardData.participantCount`의 하드코딩된 `0`을 실제 값으로 교체 — `MUST` (Phase 2-B에서 테이블이 이미 만들어졌으므로 지금 가능해진 후속 작업. **승인된(`status = 'approved'`) 인원만 카운트**한다 — `capacity` 대비 의미가 더 정확하기 때문)
- [x] 이벤트 목록 쿼리에 `profiles.avatar_url` 조인 추가(주최자 아바타 표시용) — `MUST`

**✅ Phase UX-3-B 완료** — `cover_image_url` 컬럼 마이그레이션 적용 및 `database.types.ts` 재생성. `EventForm`에 커버 이미지 URL 필드 추가(수정 폼 prefill 포함), `createEvent`/`updateEvent` 반영. `/events`·`/my` 목록 쿼리는 `profiles.avatar_url` 조인 + `event_participants`(event_id in (...), status='approved') 별도 쿼리로 참여자 수를 집계해 N+1 없이(이벤트 개수와 무관하게 쿼리 2회) `participantCount`를 채움. 브라우저에서 실제 폼 제출로 커버 이미지 URL이 있는 모임을 생성해 목록 카드에 이미지가 반영되는지 확인했고, 승인된 참여자 1명 추가 시 "1/5"로 반영·대기중 참여자 추가 시 카운트 불변(승인만 집계)을 확인. 테스트 데이터는 삭제.

#### 예상 완료 결과물

- `/events`, `/my` 양쪽이 커버 이미지·상태 배지·주최자 아바타·실제 참여자 수를 갖춘 카드형 UI로 통일됨

#### 완료 기준(체크리스트)

- [x] 모임 생성 시 커버 이미지 URL을 입력하면 목록 카드에 즉시 반영됨
- [x] 상태 배지가 예정/종료/취소됨 3종 모두 실 데이터 기준으로 정확히 표시됨(과거 일시로 테스트 데이터를 만들어 확인)
- [x] 참여자 수가 승인된 신청 건수와 일치함(SQL로 대조)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` 통과

#### 위험 요소

- **participantCount 집계 성능**: 목록의 각 이벤트마다 참여자 count를 별도 쿼리로 가져오면 N+1이 될 수 있음 → 가능하면 단일 쿼리(조인 + count) 또는 병렬 `Promise.all`로 처리
- **커버 이미지 URL 검증 부재**: 사용자가 잘못된 URL이나 이미지가 아닌 링크를 입력하면 깨진 이미지가 노출됨 → `<img>` `onError`로 플레이스홀더 폴백 처리(별도 검증 서비스 연동은 범위 밖)

---

### Phase UX-4: 프로필 페이지 신설(`/profile`) — UI → 데이터 연동

**목표**: 참고 이미지의 프로필 화면을 신규 라우트로 구현한다. 이 저장소에 없던 완전히 새로운 페이지다.

#### 4-A. UI 먼저

- [x] `/profile` 라우트 신설, mock 데이터로 레이아웃 완성: 아바타+이름+이메일 카드, 통계 카드 2개("만든 모임"/"참여한 모임"), 계정 정보 카드(역할/가입일) — `MUST`

**✅ Phase UX-4-A 완료** — ui-markup-specialist 에이전트로 `app/profile/page.tsx`(mock 데이터), `components/main-nav.tsx`(프로필 링크) 구현. 에이전트에게는 레이아웃 파일을 건드리지 말라고 지시했는데, 검토 과정에서 `/profile`에 nav를 보여줄 레이아웃이 빠져 있음을 발견해 기존 `app/my/layout.tsx`와 동일한 패턴으로 `app/profile/layout.tsx`를 직접 추가했다(이 부분은 신규 라우트 완성에 필수적이라 task 범위로 포함). 브라우저에서 상단 nav의 "프로필" 링크 클릭 → `/profile` 이동, 아바타/이름/이메일/통계 카드 2개/계정정보 카드 렌더링을 확인.

#### 4-B. 데이터 연동

- [x] Server Component로 실 데이터 연결(Cache Components `<Suspense>` 패턴 준수) — `MUST`
  - `events` count: `host_id = auth.uid()`
  - `event_participants` count: `user_id = auth.uid()`
  - `profiles`(avatar_url, full_name) + 가입일(`profiles.created_at` 또는 `auth.users.created_at`)
  - 역할은 관리자 개념이 없는 MVP이므로 고정값 `"사용자"`로 표시(추후 확장 여지만 남김)
- [x] `components/main-nav.tsx`에 "프로필" 링크 추가 — `MUST` (UX-4-A에서 이미 완료)

**✅ Phase UX-4-B 완료** — `app/profile/page.tsx`를 sync wrapper + `<Suspense>` + async `ProfileContent`로 전환. `profiles.created_at`과 `auth.users.created_at`을 SQL로 실제 대조한 결과 한 계정에서 3일 이상 차이가 발견되어(프로필 행 생성이 지연된 사례), 문서의 기본 제안(`profiles.created_at`)이 아닌 **`auth.users.created_at`**을 채택 — `getClaims()`(JWT 디코드, `created_at` 없음) 대신 `getUser()`(Auth API 조회, `created_at` 포함)를 사용. `events`/`event_participants` count는 PostgRSET `{ count: 'exact', head: true }`로 조회. 역할은 `Badge`로 표시(mock 단계의 plain text에서 구현 가이드 지시대로 변경). 브라우저 검증: 테스트 이벤트 2건(주최)+참여 1건을 만들어 프로필 페이지의 "만든 모임 2"/"참여한 모임 1"이 SQL 직접 집계와 정확히 일치함을 확인, `curl`로 쿠키 없는 요청 시 `/profile`이 307로 `/auth/login`으로 리다이렉트됨을 확인. 테스트 데이터는 삭제.

#### 예상 완료 결과물

- 로그인 사용자가 자신의 활동 통계(주최/참여 모임 수)와 계정 정보를 확인할 수 있는 신규 화면

#### 완료 기준(체크리스트)

- [x] 통계 카드의 숫자가 실제 DB 집계와 일치함(SQL로 대조 확인)
- [x] 비로그인 상태로 `/profile` 접근 시 기존 `proxy.ts` 인증 게이팅에 의해 `/auth/login`으로 리다이렉트됨(신규 게이팅 코드 불필요 — 최상위 라우트 규칙 재사용)
- [x] `npm run lint`, `npm run typecheck`, `npm run build` 통과

#### 위험 요소

- **가입일 소스 불명확**: `profiles.created_at`은 프로필 행 생성 시점이라 auth 계정 생성 시점과 다를 수 있음(트리거 지연 등) → 실제 값 확인 후 더 정확한 쪽(`auth.users.created_at`) 채택

---

### Phase UX-5: 반응형 하단 네비게이션(모바일)

**목표**: 참고 이미지의 모바일 하단 탭바를 우리 라우트 구조에 맞게 도입한다.

#### 핵심 작업

- [x] 참고 이미지의 4탭(홈/이벤트/새이벤트/프로필)을 우리 라우트로 재정의: **모임 목록(홈) / 내 모임 / 모임 만들기 / 프로필** — `MUST`
- [x] `components/bottom-nav.tsx` 신설(클라이언트 컴포넌트, `usePathname()`으로 현재 탭 강조 표시) — `MUST`
- [x] Tailwind breakpoint로 반응형 전환: 하단 탭바는 `sm:hidden`(모바일 전용), 기존 `MainNav`는 `hidden sm:flex`(데스크톱 전용)로 조정 — `MUST`
- [x] 하단 탭바에 콘텐츠가 가리지 않도록 페이지 컨테이너에 하단 여백(`pb-16` 등) 추가 — `MUST`

**✅ Phase UX-5 완료** — `components/bottom-nav.tsx` 신설, `MainNav`는 `hidden sm:flex`로 전환. `app/events/layout.tsx`/`app/my/layout.tsx`/`app/profile/layout.tsx` 3개 레이아웃(MainNav를 렌더링하는 곳 전부)에 `BottomNav`와 `pb-20 sm:pb-5` 여백을 추가. **빌드 중 실제 Cache Components 오류 발견**: `BottomNav`가 쓰는 `usePathname()`이 레이아웃에서 `<Suspense>` 없이 렌더링되면 "Uncached data accessed outside of Suspense" 빌드 실패가 발생 — 기존 `AuthButton`과 동일하게 `<Suspense fallback={null}>`로 감싸 해결. 이 원격 브라우저 세션은 `resize_window`로 실제 뷰포트가 바뀌지 않아(창은 리사이즈되지만 `window.innerWidth`는 그대로), 같은 오리진 `<iframe>`(width 390px)을 만들어 그 안에서 검증: `/events`에서 상단 nav `display:none`+하단 탭바 `display:flex`, `/profile` 이동 시 "프로필" 탭만 `aria-current="page"`로 전환, `/events/new`에서 끝까지 스크롤했을 때 제출 버튼과 하단 탭바가 겹치지 않음을 모두 확인. 테스트용 iframe은 정리.

#### 예상 완료 결과물

- 모바일 뷰포트에서는 하단 탭바로, 데스크톱 뷰포트에서는 기존 상단 nav로 각각 최적화된 내비게이션 제공

#### 완료 기준(체크리스트)

- [x] 브라우저 뷰포트를 모바일 크기로 리사이즈했을 때 하단 탭바가 노출되고 현재 경로에 해당하는 탭이 강조됨(iframe 기반 검증)
- [x] 데스크톱 크기에서는 하단 탭바가 사라지고 상단 nav만 노출됨
- [x] 하단 탭바가 페이지 콘텐츠(특히 폼의 제출 버튼 등)를 가리지 않음
- [x] `npm run lint`, `npm run typecheck`, `npm run build` 통과

#### 후속: 모바일 우선 폴리싱 패스

UX-5 완료 직후 375px 폭 기준으로 전 페이지(`/`, `/events`, `/events/new`, `/events/[id]`, `/my`, `/profile`)를 iframe으로 감싸 감사(audit)했다. 결과:

- **수평 오버플로우**: 긴 제목·주소(의도적으로 긴 텍스트로 테스트 데이터 작성)로도 6개 페이지 전부 `scrollWidth`가 viewport를 넘지 않음 — 오버플로우 없음.
- **터치 타겟 크기(WCAG 최소 44×44px 권장) 점검에서 2건 발견 및 수정**:
  1. `BottomNav`의 탭 링크가 아이콘+텍스트 크기만큼만 클릭 영역을 가져 40×33~58px로 기준 미달 → `flex-1`(균등 너비) + `justify-center`(탭바 전체 높이 64px 채움)로 변경해 93×63px로 확대.
  2. 모임 상세 페이지 탭(`TabsList`/`TabsTrigger`, 공용 `components/ui/tabs.tsx`의 shadcn 기본 스타일)이 29px 높이로 기준 미달 → 공유 컴포넌트 자체는 건드리지 않고, 상세 페이지의 `<TabsList>` 사용처에만 `!h-11 sm:!h-9`(모바일 44px, `sm` 이상은 기존 36px 유지)를 override(Tailwind의 `group-data-[...]` 조건부 클래스가 소스 순서상 이겨서 단순 `h-11`은 무시됨 → `!` important 수식어로 해결).
- `npm run lint && npm run typecheck && npm run build` 재통과 확인.

#### 위험 요소

- **레이아웃 이중 관리**: 상단 nav(`app/events/layout.tsx`, `app/my/layout.tsx`)와 하단 탭바를 각 라우트 레이아웃에 개별 추가하면 누락되기 쉬움 → 공통 레이아웃 지점(가능하면 루트 레이아웃 또는 공유 컴포넌트)에서 한 번만 렌더링하도록 배치

---

## 주요 마일스톤

| 마일스톤                  | 완료 기준                 | 핵심 산출물                                               | 상태    |
| ------------------------- | ------------------------- | --------------------------------------------------------- | ------- |
| UX-M1. 디자인 토대 완성   | Phase UX-1 완료 기준 충족 | `getEventDisplayStatus()` 유틸, Avatar 컴포넌트           | ✅ 완료 |
| UX-M2. 랜딩 리뉴얼 완료   | Phase UX-2 완료 기준 충족 | 신규 제품 랜딩 페이지(`/`)                                | ✅ 완료 |
| UX-M3. 카드 UI 개선 완료  | Phase UX-3 완료 기준 충족 | 커버 이미지·상태 배지·아바타·참여자 수를 갖춘 카드형 목록 | ✅ 완료 |
| UX-M4. 프로필 페이지 완료 | Phase UX-4 완료 기준 충족 | 신규 `/profile` 페이지(통계 실 데이터 연동)               | ✅ 완료 |
| UX-M5. 반응형 nav 완료    | Phase UX-5 완료 기준 충족 | 모바일 하단 탭바 + 데스크톱 상단 nav 반응형 전환          | ✅ 완료 |

## 의존성 맵

```
(기존 로드맵 Phase 2 완료)
   │
   ▼
Phase UX-1 (공통 디자인 토대: 상태 유틸, Avatar)
   │
   ├──▶ Phase UX-2 (랜딩 리뉴얼) — UX-1과 독립적으로 병행 가능
   │
   ▼
Phase UX-3 (카드/목록/내 모임 개선) — UX-1의 상태 유틸 필요
   │
   ▼
Phase UX-4 (프로필 페이지 신설) — UX-1의 Avatar 컴포넌트 필요
   │
   ▼
Phase UX-5 (반응형 하단 네비게이션) — UX-4의 /profile 라우트가 있어야 탭에 연결 가능
   │
   ▼
(기존 로드맵 Phase 3 "공지"부터 재개)
```

- Phase UX-2(랜딩 리뉴얼)는 다른 페이즈와 데이터 의존성이 없어 순서를 바꾸거나 UX-1과 병행해도 무방하다.
- Phase UX-3~UX-5는 순서대로 진행하는 것을 권장한다(카드 개선 → 프로필 신설 → 그 둘을 엮는 네비게이션 순).

## 크로스컷팅 관심사

### 테스팅 전략

- 기존 로드맵과 동일하게 이 저장소에는 테스트 프레임워크가 없다. 각 페이즈의 "완료 기준" 체크리스트를 수동 QA로 사용하고, `npm run lint`/`npm run typecheck`/`npm run build`를 페이즈마다 공통 게이트로 둔다.

### 문서화 계획

- `database.types.ts`: `cover_image_url` 컬럼 추가(Phase UX-3-B) 직후 재생성·커밋
- 이 로드맵 파일 자체의 체크박스를 진행 상황 추적 용도로 갱신
- 완료 후 [`gathering-event-mvp-roadmap.md`](./gathering-event-mvp-roadmap.md)의 "UI/UX 개선 페이즈" 안내 블록을 "✅ 완료"로 갱신
