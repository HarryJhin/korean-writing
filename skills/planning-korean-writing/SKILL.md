---
name: planning-korean-writing
description: Use when starting a new Korean piece from scratch and the goal, audience, or core message is unclear. Runs a short 6하원칙 브리프 to fix content and direction before writing, then hands off to writing-korean. NOT for text that already has clear content, and NOT for fixing existing text (use fixing-korean-text). 트리거 - 한국어 글 기획, 글쓰기 브리프, 무엇을 쓸지 정하기, 목적·독자 정하기.
---

# planning-korean-writing (한국어 글쓰기 계획)

새 한국어 글을 쓰기 전에 내용과 방향을 확보하는 브리프 절차다. 문체는 다루지 않는다.
문체 규칙의 단일 출처(SoT)는 `writing-korean` 스킬이고, 이 스킬은 그리로 인계한다.
파이프라인은 계획(이 스킬) 다음 작성(`writing-korean`) 다음 검토(S1 훅)다.

## 1. 조건부 게이트

핵심 3항목(독자·목적·핵심 메시지) 중 2개 이상이 요청에서 안 드러나면 브리프를 시작한다.
1개 이하만 빠졌으면 브리프를 건너뛰고 바로 `writing-korean`으로 넘어간다. 매번 강제하지
않는다. 이미 내용이 충분한 요청에 질의를 끼우면 마찰만 커진다.

## 2. 6항목 브리프

6하원칙을 글쓰기 항목으로 옮긴다. 앞 3개가 핵심, 뒤 3개는 보조다.

| 6하 | 브리프 항목 | 구분 |
|---|---|---|
| 누구에게 | 독자, 사전지식 수준 | 핵심 |
| 왜 | 목적(설득·정보·기록·경험) | 핵심 |
| 무엇을 | 한 문장 요지, 담을 사실·근거 | 핵심 |
| 어디에 | 매체·레지스터(블로그·README·커밋) | 보조 |
| 어떻게 | 톤, 존댓말 등급, 길이 | 보조 |
| 언제 | 배경 상황, 시의성 | 보조(선택) |

"어디에"(매체·레지스터)는 `writing-korean`의 R6 구성 규칙을 구동한다. 설득·경험 글이면
소제목을 질문형으로, 레퍼런스·튜토리얼이면 명사구로 가는 R6 분기가 이 항목에서 갈린다.

## 3. 질의

결손 항목만 한 번에 하나씩 묻는다. 다지선다를 우선한다. 최대 3~4문항으로 제한한다.
이미 드러난 항목은 다시 묻지 않는다. 빈 입력으로 조용히 진행하지 않는다.

## 4. 브리프 블록 산출과 인계

질의 후 6항목을 채운 짧은 브리프 블록을 응답에 표시한다. 브리프를 파일로 저장하지 않는다
(이 플러그인은 문서 생성이 범위가 아니다). 형식 예:

    [글쓰기 브리프]
    - 독자: ...
    - 목적: ...
    - 핵심 메시지: ...
    - 매체·레지스터: ...
    - 톤: ...

사용자 확인이나 즉시 진행 지시 후 `writing-korean`을 로드해 이 브리프를 입력으로 글을
쓴다. 문체는 전적으로 `writing-korean`의 R1~R6가 맡는다.

## 5. 경계 (SoT 준수)

- 이 스킬은 무엇을·왜·누구에게(내용과 방향)만 담당한다.
- 문체 규칙을 복제하지 않는다. 문체 SoT는 `writing-korean/SKILL.md` 한 곳이다.
- 내용과 방향이 이미 충분한 요청이면 이 스킬을 건너뛰고 `writing-korean`으로 직행한다.
