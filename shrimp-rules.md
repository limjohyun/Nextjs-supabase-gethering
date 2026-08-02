# AI 에이전트 운영 규칙 (shrimp-rules.md)

이 문서는 AI 에이전트가 이 저장소에서 작업할 때 즉시 참조하는 실행 규칙만 담는다. 일반 개발 지식은 담지 않는다. 더 상세한 배경은 `CLAUDE.md`(프로젝트 지침)와 `docs/guides/*`(구조/컴포넌트/스타일 가이드)를 참조하고, 그 문서들과 겹치는 내용은 여기서 반복하지 않는다.

## 1. 프로젝트 개요

- Next.js 16(App Router) + React 19 + TypeScript + TailwindCSS 3.4(v3, v4 아님) + shadcn/ui(new-york) + Supabase(`@supabase/ssr`) 스타터킷.
- `src/` 없이 루트에 `app/`, `components/`, `lib/`가 바로 위치.
- 현재 진행 중인 신규 기능: "모임 이벤트 관리 웹 MVP"(공지/참여자관리/카풀/정산). 기획·PRD·로드맵은 `docs/planning/gathering-event-mvp*.md`, 실행 태스크는 shrimp task manager에 Phase 0~6(12개)으로 등록되어 있다.

## 2. 프로젝트 아키텍처 — 이 저장소에서만 유효한 배치 규칙

- **`/protected` 하위에 새 라우트를 넣지 마라.** `proxy.ts` → `lib/supabase/proxy.ts#updateSession`이 `/`, `/login*`, `/auth*`를 제외한 **모든** 경로를 이미 인증 필수로 리다이렉트 처리한다. 신규 라우트(`/events`, `/my` 등)는 `/instruments`와 동일하게 최상위에 배치하고 별도 게이팅 코드를 추가하지 않는다.
- `app/instruments/page.tsx`가 이 저장소의 유일한 비보일러플레이트 예시 페이지(Server Component + `Suspense` + `(await createClient()).from(...).select()`). 조회 전용 신규 페이지는 이 패턴을 따른다.
- `components/tutorial/*`와 `/`(`app/page.tsx`)의 `ConnectSupabaseSteps`/`SignUpUserSteps`는 스타터킷 온보딩 잔재다. 수정·재사용 대상이 아니다.
- `components/`는 `ui/`(shadcn 원자 컴포넌트)와 나머지(플랫 배치) 2층 구조만 존재한다. `layout/`, `navigation/`, `sections/`, `common/` 같은 하위 폴더를 임의로 만들지 마라 — 실제로 파일이 여러 개 쌓이기 전까지는 금지.
- `docs/guides/component-patterns.md`의 `UserCard`, `ProductPage`, `CartProvider` 등은 **실재하지 않는 범용 예시**다. 이 이름으로 실제 파일을 찾거나 import하려 하지 마라(`CLAUDE.md`에 명시된 경고).

## 3. 코드 규칙 — 신규 도입 요소 한정

- 파일명/컴포넌트명 컨벤션은 `docs/guides/project-structure.md`를 따른다(kebab-case 파일, PascalCase 컴포넌트).
- Zod 스키마: `lib/validations/<domain>.ts` (예: `lib/validations/event.ts`).
- Server Action: 기능 디렉터리 안에 `actions.ts` 또는 `<domain>-actions.ts`로 분리한다(예: `app/events/actions.ts`, `app/events/[id]/participants-actions.ts`). 하나의 파일에 서로 다른 도메인의 액션을 섞지 마라.
- `tsconfig.json`의 경로 별칭은 `"@/*": ["./*"]` 하나뿐이다. `components.json`의 `aliases`(components/utils/ui/lib/hooks)는 `shadcn` CLI가 파일을 생성할 위치를 정하는 용도일 뿐 tsconfig 경로가 아니다. `@/hooks`는 대응 폴더가 아직 없다 — 훅이 실제로 필요해지기 전까지 만들지 마라.

## 4. 기능 구현 표준 — 모임 이벤트 관리 기능 전용

- 각 기능 페이즈는 반드시 **A. UI(mock) → B. 데이터 연동** 순서로 구현한다. B단계 코드(Supabase 쿼리, 마이그레이션, Server Action)를 A단계보다 먼저 작성하지 마라. 이는 사용자의 전역 원칙("구조 우선 접근법")을 따른 것이며 shrimp task manager의 태스크 분해(Phase N-A/Phase N-B)와 1:1로 대응한다.
- **참여자관리(Phase 2 / `event_participants`)가 공지·카풀·정산(Phase 3~5)의 RLS 선행 조건이다.** `event_participants.status = 'approved'`를 참조하는 조회 정책을 Phase 3 이전에 확정하려 하지 마라. Phase 3~5는 서로 순서를 바꾸거나 병행해도 되지만 Phase 2 완료 전에는 시작하지 않는다.
- "승인된 참여자만 조회 가능" RLS 패턴은 다음 형태를 모든 기능 테이블(announcements/carpools/carpool_requests/settlements/settlement_shares)에 동일하게 재사용한다:
  ```sql
  exists (
    select 1 from event_participants
    where event_id = <table>.event_id and user_id = auth.uid() and status = 'approved'
  ) or exists (
    select 1 from events where id = <table>.event_id and host_id = auth.uid()
  )
  ```
- 카풀 확정(F016)에서 `confirmed` 건수가 `seat_count`를 초과하는 확정은 **UI에서 경고만 하고 끝내지 말고 서버(Server Action) 단에서 최신 카운트를 재조회한 뒤 하드 블록**한다.
- 정산 재계산(F017~F019)에서 `settlement_shares.amount_owed`를 upsert할 때 `is_paid` 컬럼은 **절대 update set절에 포함하지 마라**(기존 체크 상태 보존).

## 5. 프레임워크/라이브러리 사용 표준

- 신규 shadcn 컴포넌트가 필요하면 `npx shadcn@latest add <name>`으로 추가한다(현재 `card/checkbox/input/label/badge/button/dropdown-menu/separator`만 설치됨 — `tabs/dialog/select/textarea/table/form`은 이번 기능에서 처음 추가됨). 수동으로 shadcn 컴포넌트 소스를 베껴 만들지 마라.
- `react-hook-form`, `zod`, `@hookform/resolvers`는 이 저장소에 아직 없다. Phase 0에서 최초 설치하고, 이후 모든 폼(모임 생성/수정, 카풀 등록, 비용 항목 등록)이 동일 패턴을 재사용한다.
- Supabase 클라이언트는 반드시 기존 3분리 팩토리를 그대로 재사용한다: 브라우저=`lib/supabase/client.ts`, Server Component/Action=`lib/supabase/server.ts`, proxy=`lib/supabase/proxy.ts`. 새 클라이언트 생성 함수를 추가하지 마라.
- **신규 기능(모임 관리)의 모든 쓰기(mutation)는 Server Action으로 구현한다.** 기존 `components/login-form.tsx` 등 인증 폼은 `"use client"` + `useState` + `lib/supabase/client.ts` 직접 호출 방식이지만, 이는 이번 기능 범위 밖의 기존 코드다 — 이 패턴을 신규 기능에 복사하지 말고, 반대로 기존 인증 폼을 Server Action으로 리팩터링하지도 마라(불필요한 범위 확장).

## 6. 워크플로우 표준 — 마이그레이션 순서

신규 테이블이 필요한 모든 태스크에서 다음 순서를 반드시 지킨다:

1. `supabase/migrations/`에 마이그레이션 파일 작성 (파일이 없으면 Phase 1-B에서 디렉터리 신설)
2. `mcp__supabase__apply_migration`으로 적용
3. RLS 정책 작성 및 적용
4. `mcp__supabase__get_advisors`로 보안 점검
5. `mcp__supabase__generate_typescript_types`로 `lib/supabase/database.types.ts` 재생성
6. 재생성된 `database.types.ts`를 **반드시 커밋 대상에 포함**(2~5단계만 하고 6을 빠뜨리면 타입만 stale해지고 빌드는 깨지지 않아 누락을 알아채기 어렵다 — `CLAUDE.md` 참고)
7. Server Action에서 실제 쿼리 연결, 같은 기능의 mock 데이터 제거

## 7. 핵심 파일 상호작용 표준

- `supabase/migrations/*.sql`을 추가하면 **반드시 같은 작업 안에서** `lib/supabase/database.types.ts`를 재생성·갱신한다(둘은 항상 함께 변경).
- 새 라우트(`app/events/**`, `app/my/**`)를 추가하면 `components/main-nav.tsx`(Phase 0에서 신설)의 메뉴 항목도 함께 갱신한다.
- 기존 루트의 `ROADMAP.md`(개발 도구/CI 세팅, 이미 완료됨)와 `docs/planning/gathering-event-mvp-roadmap.md`(이번 기능 로드맵)는 **서로 다른 문서다.** 이번 기능 작업 중 `ROADMAP.md`(루트)를 덮어쓰거나 내용을 섞지 마라.
- Phase 6(통합 QA·배포·문서화)에서만 `docs/guides/*`와 `CLAUDE.md`를 이번 기능 관련 내용으로 갱신한다 — 그 전 페이즈에서 미리 갱신하지 않는다(구현이 확정되지 않은 내용을 문서화하지 않기 위함).

## 8. AI 의사결정 표준

- 필요한 shadcn 컴포넌트가 설치돼 있지 않을 때: 즉석에서 수동 구현하지 말고 `npx shadcn@latest add <name>`을 먼저 실행한다.
- RLS 정책 문구가 애매할 때: 4장의 "승인된 참여자만 조회" 표준 패턴을 그대로 복사해 테이블명만 바꾼다 — 매번 새로 설계하지 않는다.
- 어떤 페이즈부터 시작해야 할지 애매할 때: shrimp task manager의 태스크 dependencies(Phase 0→1-A→1-B→2-A→2-B→{3-A,4-A,5-A}→...→6)를 조회해 그 순서를 따른다. 로컬 판단으로 순서를 재배열하지 않는다.
- `eslint.config.mjs`를 수정해야 할 때: `FlatCompat`로 되돌리지 말고 현재의 `eslint-config-next/core-web-vitals` / `eslint-config-next/typescript` 서브패스 직접 import 방식을 유지한다(v16 flat config 대응 결과, 되돌리면 다시 깨짐).

## 9. 금지 행동

- `lib/supabase/database.types.ts`를 손으로 직접 수정하지 마라 — 항상 재생성한다.
- `eslint.config.mjs`를 `FlatCompat` 방식으로 되돌리지 마라.
- `docs/guides/component-patterns.md`의 예시 컴포넌트명(`UserCard`, `ProductPage`, `CartProvider` 등)을 실재 파일로 착각해 import하거나 수정하려 하지 마라.
- 루트의 `ROADMAP.md`(완료된 CI/도구 세팅 기록)를 이번 기능 로드맵으로 덮어쓰지 마라.
- 기존 인증 폼(`login-form.tsx`, `sign-up-form.tsx` 등)을 이번 기능과 무관하게 Server Action으로 리팩터링하지 마라.
- Phase 2(참여자관리)가 끝나기 전에 Phase 3~5의 "승인된 참여자만 조회" RLS를 작성하지 마라.
- 카풀 좌석 초과 확정을 클라이언트 UI 비활성화만으로 막고 서버 재검증을 생략하지 마라.
- 정산 재계산 시 `is_paid`를 upsert의 update 대상 컬럼에 포함시키지 마라.
- 테스트 프레임워크(Vitest/Jest)를 임의로 새로 설치하지 마라 — 이 저장소는 의도적으로 미구성 상태이며, 각 태스크의 검증은 `npm run lint && npm run typecheck && npm run build` + 수동 시나리오로 대체한다.
