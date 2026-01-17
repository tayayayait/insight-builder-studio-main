아래는 `상세서.md`의 **구조(섹션/하위항목/규칙/표)**를 빠짐없이 담아, AI가 파싱/학습/변환하기 쉬운 형태로 정리한 **XML 예시**입니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<uiuxSpec id="ai-ocr-survey-service" version="v1.0" lastUpdated="2026-01-16">
  <meta>
    <title>AI OCR 기반 수기 설문지 인식 · 자동 통계 분석 서비스 UI/UX 상세 명세</title>
    <scope>
      <platform>PC Web</platform>
      <platform>Mobile Web</platform>
      <responsive>true</responsive>
    </scope>
    <sourceDocument>
      <format>markdown</format>
      <path>상세서.md</path>
    </sourceDocument>
  </meta>

  <section id="1" title="문서 목적 및 범위">
    <purpose>
      <text>AI OCR 기반 설문지 인식 및 자동 통계 분석 서비스의 UI/UX를 구현 가능한 수준의 규칙(Design System) 및 화면/플로우 명세로 정의한다.</text>
    </purpose>
    <scopeDefinition>
      <targets>
        <target>기획</target>
        <target>디자인</target>
        <target>프런트엔드</target>
        <target>백엔드(화면 연동)</target>
        <target>QA</target>
      </targets>
      <includes>
        <item>색상</item>
        <item>타이포</item>
        <item>레이아웃</item>
        <item>컴포넌트 규격</item>
        <item>반응형 규칙</item>
        <item>주요 화면 구조</item>
        <item>상호작용(상태/에러/로딩)</item>
        <item>접근성</item>
      </includes>
      <excludes>
        <item>모델 성능/통계 알고리즘 구현 상세(단, UI에서 노출되는 입력/출력 요구는 포함)</item>
      </excludes>
    </scopeDefinition>
  </section>

  <section id="2" title="UX 원칙(필수 준수)">
    <principles>
      <principle id="2.1" title="실수 방지(오류 예방)">
        <rule>업로드/분석/내보내기 등 되돌리기 어려운 작업은 확인 모달을 제공한다.</rule>
        <rule>작업 단위(프로젝트/배치)를 화면에서 항상 명확히 표시한다.</rule>
      </principle>
      <principle id="2.2" title="신뢰(감사 가능성)">
        <rule>OCR 추출값은 원본 근거(좌표/페이지)를 항상 확인 가능해야 한다.</rule>
        <rule>수정 이력과 확정 상태를 표시한다.</rule>
      </principle>
      <principle id="2.3" title="효율(대량 처리)">
        <rule>목록/테이블/필터/일괄작업(배치/다중선택)을 제공한다.</rule>
      </principle>
      <principle id="2.4" title="가시성(진행 상태)">
        <rule>OCR/분석은 비동기 Job으로 처리되며 진행률/대기열/완료 알림을 제공한다.</rule>
      </principle>
      <principle id="2.5" title="일관성">
        <rule>동일 개념은 동일 컴포넌트/라벨/아이콘/동작으로 통일한다.</rule>
        <example>프로젝트=설문 단위, 배치=업로드 묶음</example>
      </principle>
    </principles>
  </section>

  <section id="3" title="정보구조(IA) / 메뉴 구성">
    <globalMenu id="3.1" title="전역 메뉴(PC 좌측 사이드바 기준)">
      <menuItem label="대시보드" />
      <menuItem label="프로젝트(설문) 관리">
        <menuItem label="프로젝트 목록" />
        <menuItem label="설문 템플릿/문항 관리" optional="true" />
      </menuItem>
      <menuItem label="데이터 수집">
        <menuItem label="업로드/가져오기(PDF/이미지/엑셀)" />
        <menuItem label="배치/작업 현황(OCR/정제/분석)" />
      </menuItem>
      <menuItem label="데이터 검수(Validation)">
        <menuItem label="OCR 결과 검수/수정" />
        <menuItem label="미확정/오류 항목 큐" />
      </menuItem>
      <menuItem label="통계 분석">
        <menuItem label="분석 실행/이력" />
        <menuItem label="결과 보기(요약/상세)" />
      </menuItem>
      <menuItem label="리포트">
        <menuItem label="리포트 생성" />
        <menuItem label="내보내기(PDF/PPT/Excel)" />
      </menuItem>
      <menuItem label="관리자" access="adminOnly">
        <menuItem label="사용자/권한" />
        <menuItem label="감사 로그" />
        <menuItem label="시스템 설정(사전/모델/통계 옵션)" />
      </menuItem>
    </globalMenu>

    <mobileNavigation id="3.2" title="모바일 내비게이션">
      <pattern>상단 App Bar + 햄버거 메뉴(드로어)</pattern>
      <optionalBottomTabs enabled="true">
        <tab>대시보드</tab>
        <tab>업로드</tab>
        <tab>검수</tab>
        <tab>리포트</tab>
      </optionalBottomTabs>
    </mobileNavigation>
  </section>

  <section id="4" title="디자인 시스템(Design Tokens)">
    <note>본 절의 값은 UI 구현의 기준 값(토큰)이며, CSS 변수/테마로 관리한다.</note>

    <designTokens>
      <colors id="4.1" title="컬러 팔레트">
        <palette id="4.1.1" title="브랜드/중립/상태 색상">
          <color token="--c-primary-600" hex="#2563EB">
            <usage>주요 버튼, 링크, 활성 탭/필터</usage>
            <note>기본 Primary</note>
          </color>
          <color token="--c-primary-700" hex="#1D4ED8">
            <usage>hover/active</usage>
            <note>대비 확보</note>
          </color>
          <color token="--c-secondary-600" hex="#0F766E">
            <usage>보조 강조(선택적)</usage>
            <note>차트 보조색에도 사용</note>
          </color>
          <color token="--c-bg" hex="#F8FAFC">
            <usage>전체 배경</usage>
            <note>페이지 배경</note>
          </color>
          <color token="--c-surface" hex="#FFFFFF">
            <usage>카드/모달 표면</usage>
          </color>
          <color token="--c-text-strong" hex="#0F172A">
            <usage>본문/제목</usage>
            <note>Slate-900</note>
          </color>
          <color token="--c-text" hex="#334155">
            <usage>일반 본문</usage>
            <note>Slate-700</note>
          </color>
          <color token="--c-text-muted" hex="#64748B">
            <usage>보조 텍스트</usage>
            <note>Slate-500</note>
          </color>
          <color token="--c-border" hex="#E2E8F0">
            <usage>경계선/구분선</usage>
            <note>Slate-200</note>
          </color>
          <color token="--c-border-strong" hex="#CBD5E1">
            <usage>테이블 헤더/강조 구분</usage>
            <note>Slate-300</note>
          </color>
          <color token="--c-success-600" hex="#16A34A">
            <usage>성공/완료</usage>
          </color>
          <color token="--c-warning-600" hex="#D97706">
            <usage>경고/주의</usage>
          </color>
          <color token="--c-danger-600" hex="#DC2626">
            <usage>오류/삭제/위험</usage>
          </color>
          <color token="--c-info-600" hex="#0284C7">
            <usage>안내/정보</usage>
          </color>
          <color token="--c-focus" hex="#93C5FD">
            <usage>포커스 링</usage>
            <note>2px</note>
          </color>
        </palette>

        <tints id="4.1.2" title="상태/배경 Tint">
          <color token="--c-primary-50" hex="#EFF6FF">
            <usage>선택 배경, 강조 배경</usage>
          </color>
          <color token="--c-success-50" hex="#F0FDF4">
            <usage>성공 배경</usage>
          </color>
          <color token="--c-warning-50" hex="#FFFBEB">
            <usage>경고 배경</usage>
          </color>
          <color token="--c-danger-50" hex="#FEF2F2">
            <usage>오류 배경</usage>
          </color>
          <color token="--c-overlay" hex="rgba(15, 23, 42, 0.55)">
            <usage>모달 오버레이</usage>
          </color>
        </tints>

        <chartColors id="4.1.3" title="차트 컬러(기본 8색)">
          <rule>차트는 동일한 의미를 동일 색으로 고정한다(예: 남/여, 그룹 A/B).</rule>
          <series index="1" hex="#2563EB" />
          <series index="2" hex="#0F766E" />
          <series index="3" hex="#7C3AED" />
          <series index="4" hex="#DB2777" />
          <series index="5" hex="#D97706" />
          <series index="6" hex="#16A34A" />
          <series index="7" hex="#0284C7" />
          <series index="8" hex="#334155" />
        </chartColors>
      </colors>

      <typography id="4.2" title="타이포그래피">
        <fonts id="4.2.1" title="폰트">
          <primary>Pretendard</primary>
          <fallbacks>
            <font>Noto Sans KR</font>
            <font>Apple SD Gothic Neo</font>
            <font>Malgun Gothic</font>
            <font>sans-serif</font>
          </fallbacks>
          <mono>ui-monospace</mono>
          <monoUsage>테이블의 ID/Job ID 등 제한적 사용</monoUsage>
        </fonts>

        <typeScale id="4.2.2" title="타입 스케일(Desktop 기준)">
          <style name="H1" size="24" lineHeight="32" weight="700">
            <usage>페이지 타이틀</usage>
          </style>
          <style name="H2" size="20" lineHeight="28" weight="700">
            <usage>섹션 타이틀</usage>
          </style>
          <style name="H3" size="16" lineHeight="24" weight="600">
            <usage>카드/패널 타이틀</usage>
          </style>
          <style name="Body" size="14" lineHeight="22" weight="400">
            <usage>기본 본문</usage>
          </style>
          <style name="Small" size="12" lineHeight="18" weight="400">
            <usage>보조 텍스트, 캡션</usage>
          </style>
          <mobileOverrides>
            <override style="H1" size="20" lineHeight="28" />
            <override style="Body" size="14" lineHeight="22" note="유지(가독성 우선)" />
          </mobileOverrides>
        </typeScale>
      </typography>

      <layout id="4.3" title="레이아웃/그리드/간격">
        <breakpoints id="4.3.1" title="브레이크포인트(반응형)">
          <breakpoint name="xs" min="0" max="359" />
          <breakpoint name="sm" min="360" max="767" note="대부분 모바일" />
          <breakpoint name="md" min="768" max="1023" note="태블릿" />
          <breakpoint name="lg" min="1024" max="1279" note="노트북" />
          <breakpoint name="xl" min="1280" max="99999" note="데스크톱" />
        </breakpoints>

        <grid id="4.3.2" title="그리드">
          <gridSpec device="desktop" breakpoint="lgPlus" columns="12" gutter="24" margin="24" />
          <gridSpec device="tablet" breakpoint="md" columns="8" gutter="20" margin="20" />
          <gridSpec device="mobile" breakpoint="smMinus" columns="4" gutter="16" margin="16" />
          <contentMaxWidth default="1200" />
          <contentMaxWidth context="validationViewer" value="1440" note="검수 화면(뷰어+패널) 허용" />
        </grid>

        <spacingScale id="4.3.3" title="간격(Spacing Scale)">
          <rule>기본 단위는 4px이며 아래 값만 사용한다.</rule>
          <space>4</space>
          <space>8</space>
          <space>12</space>
          <space>16</space>
          <space>20</space>
          <space>24</space>
          <space>32</space>
          <space>40</space>
          <space>48</space>
          <space>64</space>
        </spacingScale>
      </layout>

      <surfaces id="4.4" title="라운드/그림자/테두리">
        <radius id="4.4.1" title="라운드(Radius)">
          <value token="--r-sm" px="8" usage="입력창, 작은 카드" />
          <value token="--r-md" px="12" usage="기본 카드/패널" />
          <value token="--r-lg" px="16" usage="모달" />
          <value token="--r-pill" px="999" usage="칩/배지" />
        </radius>

        <borders id="4.4.2" title="보더(Border)">
          <border name="default">1px solid --c-border</border>
          <border name="strong">1px solid --c-border-strong</border>
          <border name="focus">2px solid --c-focus (outline)</border>
        </borders>

        <elevation id="4.4.3" title="그림자(Elevation)">
          <shadow token="--e-1">0 1px 2px rgba(15,23,42,.08)</shadow>
          <shadow token="--e-2">0 6px 20px rgba(15,23,42,.12)</shadow>
          <shadow token="--e-3">0 16px 40px rgba(15,23,42,.18)</shadow>
        </elevation>
      </surfaces>
    </designTokens>
  </section>

  <section id="5" title="컴포넌트 규격(필수 공통 규칙)">
    <commonRule>모든 컴포넌트는 기본/hover/active/disabled/focus/error/loading 상태를 지원해야 한다.</commonRule>

    <components>
      <component id="5.1" name="Button">
        <variants id="5.1.1">
          <variant name="Primary">주요 CTA(저장, 분석 실행, 업로드 완료)</variant>
          <variant name="Secondary">보조(미리보기, 필터)</variant>
          <variant name="TertiaryOrGhost">카드 내부 보조 액션(자세히)</variant>
          <variant name="Danger">삭제/되돌릴 수 없는 작업</variant>
        </variants>
        <sizes id="5.1.2">
          <size name="S" height="32" paddingX="12" font="12/18" radius="8" />
          <size name="M" default="true" height="40" paddingX="16" font="14/22" radius="10" />
          <size name="L" height="48" paddingX="20" font="14/22" radius="12" />
        </sizes>
        <stateRules id="5.1.3">
          <rule state="disabled">배경 --c-border, 텍스트 --c-text-muted, 커서 not-allowed</rule>
          <rule state="loading">스피너 + 텍스트 유지(폭 고정), 중복 클릭 방지</rule>
        </stateRules>
      </component>

      <component id="5.2" name="Input/Textarea">
        <baseSpec id="5.2.1">
          <height default="40" small="32" large="48" />
          <padding>12</padding>
          <radius>10</radius>
          <border>1px --c-border</border>
          <focusOutline>2px --c-focus</focusOutline>
          <placeholderColor>--c-text-muted</placeholderColor>
        </baseSpec>
        <labelHelpError id="5.2.2">
          <label>입력 상단 좌측, 12~14px, 필수는 * (Danger 색)</label>
          <help>Small(12px), --c-text-muted</help>
          <error>Small(12px), --c-danger-600 + 아이콘, 입력 보더 --c-danger-600</error>
        </labelHelpError>
      </component>

      <component id="5.3" name="Select/ComboBox">
        <rules>
          <rule>기본 높이 40px, 우측 드롭다운 아이콘</rule>
          <rule>검색형 콤보박스는 옵션 20개 이상이거나 프로젝트/변수 선택에 사용</rule>
          <rule>옵션 리스트 최대 높이 320px, 스크롤</rule>
        </rules>
      </component>

      <component id="5.4" name="Checkbox/Radio/Toggle">
        <checkbox>
          <size>16</size>
          <radius>4</radius>
          <usage>표/리스트에서 다중선택(배치/행 선택)</usage>
        </checkbox>
        <radio>
          <size>16</size>
          <usage>단일 선택(분석 그룹 지정 등)</usage>
        </radio>
        <toggle>
          <size width="36" height="20" />
          <knob>16</knob>
          <usage>설정(자동 확정, 알림 수신)</usage>
        </toggle>
      </component>

      <component id="5.5" name="Badge/Chip">
        <badge id="5.5.1">
          <status name="완료" bg="--c-success-50" text="--c-success-600" />
          <status name="진행중" bg="--c-primary-50" text="--c-primary-600" />
          <status name="경고" bg="--c-warning-50" text="--c-warning-600" />
          <status name="오류" bg="--c-danger-50" text="--c-danger-600" />
        </badge>
        <chip id="5.5.2">
          <height>28</height>
          <paddingX>10</paddingX>
          <radius>pill</radius>
          <structure>좌측 라벨 + 우측 x 제거 아이콘</structure>
        </chip>
      </component>

      <component id="5.6" name="Card">
        <baseCard id="5.6.1">
          <background>--c-surface</background>
          <border>1px --c-border</border>
          <radius>12</radius>
          <shadow>--e-1</shadow>
          <padding>16</padding>
          <sectionGap>16</sectionGap>
        </baseCard>
        <kpiCard id="5.6.2">
          <minHeight>96</minHeight>
          <layout>좌: 라벨(12px), 값(24px/700) / 우: 증감/아이콘</layout>
          <interaction>클릭 시 상세로 Drill-down 가능(옵션)</interaction>
        </kpiCard>
      </component>

      <component id="5.7" name="Table">
        <spec id="5.7.1">
          <headerHeight>44</headerHeight>
          <rowHeight>44</rowHeight>
          <cellPadding x="12" y="10" />
          <headerBackground>--c-bg</headerBackground>
          <headerBorderBottom>--c-border-strong</headerBorderBottom>
          <alignment>
            <numeric>right</numeric>
            <text>left</text>
            <status>centerOptional</status>
          </alignment>
        </spec>
        <requirements id="5.7.2">
          <feature>정렬(sort)</feature>
          <feature>페이지네이션</feature>
          <feature>컬럼 숨김/표시</feature>
          <feature>열 너비 조절(검수 화면 우선)</feature>
          <feature>행 선택(checkbox) + 일괄 작업(삭제, 재분석, 내보내기)</feature>
          <feature>빈 상태/로딩 스켈레톤 제공</feature>
        </requirements>
      </component>

      <component id="5.8" name="Tabs">
        <spec>
          <height>44</height>
          <activeStyle>텍스트 --c-primary-600 + 하단 인디케이터 2px</activeStyle>
          <example>요약/상세/원본/로그</example>
        </spec>
      </component>

      <component id="5.9" name="Modal">
        <sizes id="5.9.1">
          <size name="S" width="420" usage="확인/경고" />
          <size name="M" width="640" usage="폼(프로젝트 생성)" />
          <size name="L" width="960" usage="내보내기 설정/미리보기" />
        </sizes>
        <rules id="5.9.2">
          <rule>오버레이: --c-overlay</rule>
          <rule>닫기: 우상단 X + ESC + 오버레이 클릭(파괴적 작업 시 오버레이 클릭 비활성)</rule>
          <rule>하단 버튼 영역: Primary(우측) / Secondary(좌측)</rule>
        </rules>
      </component>

      <component id="5.10" name="Drawer/SidePanel">
        <spec>
          <direction>right</direction>
          <width default="360" detail="480" />
          <scroll>본문만 스크롤, 헤더/푸터 고정</scroll>
        </spec>
      </component>

      <component id="5.11" name="Toast">
        <spec>
          <position>rightTop</position>
          <maxVisible>3</maxVisible>
          <autoCloseSeconds default="4" error="8" note="오류는 8초 또는 수동 닫힘" />
          <jobCompletion>
            <rule>바로가기 액션 포함</rule>
          </jobCompletion>
        </spec>
      </component>

      <component id="5.12" name="Uploader">
        <dropzoneHeight desktop="160" mobile="120" />
        <acceptedTypes>
          <type>PDF</type>
          <type>JPG</type>
          <type>PNG</type>
          <type>XLSX</type>
          <type>CSV</type>
        </acceptedTypes>
        <preValidation>
          <rule>파일 확장자 검증</rule>
          <rule>용량 제한(기본 50MB, 설정 가능)</rule>
          <rule>페이지 수 제한(예: 200p 제한)</rule>
        </preValidation>
        <uploadUx>
          <feature>업로드 진행률 표시</feature>
          <feature>실패 시 재시도</feature>
        </uploadUx>
      </component>

      <component id="5.13" name="PDF/Image Viewer">
        <layout>중앙 뷰어 + 좌측 썸네일 + 우측 필드 목록(3-pane)</layout>
        <zoom min="50" max="200" step="10">
          <preset>맞춤</preset>
          <preset>너비맞춤</preset>
        </zoom>
        <pageNavigation>
          <control>상단 페이지네이션</control>
          <control>키보드(← → / PgUp PgDn)</control>
        </pageNavigation>
        <ocrHighlight>
          <default>Primary 30% 투명</default>
          <selected>60% + 테두리 강조</selected>
        </ocrHighlight>
      </component>
    </components>
  </section>

  <section id="6" title="공통 패턴(화면 규칙)">
    <pattern id="6.1" name="Page Header">
      <left>페이지 타이틀(H1) + 보조 설명(Small)</left>
      <right>주요 액션(Primary), 보조 액션(Secondary), 도움말 아이콘</right>
      <breadcrumb optional="true">프로젝트/배치 계층이 깊은 화면에만 표시</breadcrumb>
    </pattern>
    <pattern id="6.2" name="Filter Bar(목록 공통)">
      <fields>
        <field>기간(날짜 범위)</field>
        <field>상태</field>
        <field>검색어</field>
        <field>고급필터(드로어)</field>
      </fields>
      <applyMode>
        <default>자동 적용</default>
        <advanced>적용 버튼 제공(복잡도에 따라)</advanced>
      </applyMode>
      <display>필터는 칩으로 노출(제거 가능)</display>
    </pattern>
    <pattern id="6.3" name="Empty State">
      <structure>아이콘 + 1줄 설명 + Primary 버튼(첫 행동 유도)</structure>
      <example>업로드된 설문지가 없습니다. PDF를 업로드해 OCR을 시작하세요.</example>
    </pattern>
    <pattern id="6.4" name="Error Handling">
      <rule>필드 에러: 입력 하단 인라인</rule>
      <rule>작업 에러: 페이지 상단 Alert + 재시도 버튼</rule>
      <rule optional="true">시스템 장애: 상태 페이지/문의 링크</rule>
    </pattern>
    <pattern id="6.5" name="Loading/Async Job">
      <rule>목록/테이블: 스켈레톤</rule>
      <rule>버튼: 내부 스피너</rule>
      <jobCard>
        <stages>
          <stage>업로드</stage>
          <stage>OCR</stage>
          <stage>정제</stage>
          <stage>분석</stage>
          <stage>리포트</stage>
        </stages>
        <fields>
          <field>진행률 바</field>
          <field>ETA</field>
          <field>단계 표시</field>
        </fields>
      </jobCard>
      <rule>작업 중 페이지 이탈 가능, 완료 시 알림/메일(옵션)</rule>
    </pattern>
  </section>

  <section id="7" title="화면 명세(PC 우선, 모바일 규칙 포함)">
    <flow>프로젝트(설문 단위) → 배치(업로드 묶음) → 결과(데이터/분석/리포트)</flow>

    <screen id="7.1" name="로그인/권한">
      <layout>
        <left>제품 소개(일러스트/문구)</left>
        <right>로그인 폼 카드(폭 420px)</right>
      </layout>
      <form>
        <field>이메일</field>
        <field>비밀번호</field>
        <feature>비밀번호 보기 토글</feature>
        <action type="primary">로그인</action>
      </form>
      <rules>
        <rule>실패 시: 인라인 메시지 + 토스트</rule>
        <rule>계정 상태(잠김/비활성) 메시지 분리</rule>
      </rules>
    </screen>

    <screen id="7.2" name="대시보드">
      <kpiCards count="4">
        <kpi>오늘 업로드 수</kpi>
        <kpi>처리중 배치</kpi>
        <kpi>오류 항목</kpi>
        <kpi>최근 리포트</kpi>
      </kpiCards>
      <main>
        <panel name="최근 작업">
          <tableColumns>
            <col>배치명</col>
            <col>프로젝트</col>
            <col>상태</col>
            <col>진행률</col>
            <col>생성일</col>
            <col>액션(보기)</col>
          </tableColumns>
        </panel>
        <panel name="알림">
          <items>실패/주의 이벤트</items>
          <actions>재시도/상세</actions>
        </panel>
      </main>
      <mobile>
        <rule>KPI 2열 그리드</rule>
        <rule>테이블 → 카드 리스트</rule>
      </mobile>
    </screen>

    <screen id="7.3" name="프로젝트 목록/생성">
      <list>
        <toolbar>
          <search />
          <action type="primary">프로젝트 생성</action>
        </toolbar>
        <tableColumns>
          <col>프로젝트명</col>
          <col>설명</col>
          <col>생성자</col>
          <col>최근 업데이트</col>
          <col>배치 수</col>
          <col>상태</col>
        </tableColumns>
      </list>
      <modal id="createEdit" size="M">
        <fields>
          <field required="true">프로젝트명</field>
          <field>설명</field>
          <field>설문 유형(PDF 기반/엑셀 기반/혼합)</field>
          <field>기본 통계 옵션(토글)</field>
        </fields>
        <postCreateCta>업로드로 이동</postCreateCta>
      </modal>
    </screen>

    <screen id="7.4" name="데이터 업로드/가져오기(수집)">
      <layout columns="2">
        <left>
          <componentRef>Uploader</componentRef>
          <queue>업로드 큐(파일 리스트)</queue>
        </left>
        <right>
          <card name="배치 설정">
            <field>배치명(기본: 날짜+프로젝트명)</field>
            <field>데이터 유형: PDF/이미지/엑셀(복수 가능)</field>
            <field>설문 템플릿 매칭(자동/수동)</field>
            <field>OCR 옵션: 언어, 체크박스 인식 강화, 손글씨(옵션)</field>
            <field>개인정보 포함 여부(토글) + 마스킹 옵션(선택)</field>
          </card>
        </right>
      </layout>
      <submit>
        <action type="primary">업로드 시작</action>
        <result>Job 생성 → 작업 현황으로 이동</result>
      </submit>
    </screen>

    <screen id="7.5" name="배치/작업 현황">
      <table>
        <columns>
          <col>배치명</col>
          <col>프로젝트</col>
          <col>파일 수</col>
          <col>페이지 수</col>
          <col>상태(배지)</col>
          <col>진행률</col>
          <col>실패 건수</col>
          <col>생성일</col>
        </columns>
        <interaction>행 클릭 시 배치 상세(탭: 요약/파일/로그)</interaction>
      </table>
      <detail>
        <tabs>
          <tab name="요약">
            <summaryKpis>
              <kpi>전체 응답지 수</kpi>
              <kpi>추출 항목 수</kpi>
              <kpi>미확정 항목</kpi>
              <kpi>오류율</kpi>
            </summaryKpis>
          </tab>
          <tab name="파일">
            <feature>파일별 상태</feature>
            <feature>재처리</feature>
          </tab>
          <tab name="로그">
            <feature>단계별 로그(접기)</feature>
            <feature>오류 원인 코드 표시</feature>
          </tab>
        </tabs>
      </detail>
    </screen>

    <screen id="7.6" name="OCR 결과 검수/수정(핵심 화면)">
      <layout type="threePane" desktop="true">
        <leftPane name="썸네일" width="220">
          <item>페이지 리스트</item>
          <item>페이지 번호 + 상태 점(정상/주의/오류)</item>
          <filter>미확정만</filter>
        </leftPane>
        <centerPane name="뷰어">
          <toolbar>
            <control>줌</control>
            <control>페이지 이동</control>
            <control>하이라이트 토글</control>
            <control>회전</control>
            <control optional="true">밝기/대비</control>
          </toolbar>
        </centerPane>
        <rightPane name="필드 패널" widthMin="360" widthMax="480">
          <fieldItem>
            <field>문항명</field>
            <field>추출값</field>
            <field>신뢰도(%) 배지</field>
            <field>상태(확정/미확정/오류)</field>
            <field>편집 아이콘</field>
          </fieldItem>
          <interaction>필드 클릭 시 중앙 하이라이트로 동기화</interaction>
        </rightPane>
      </layout>

      <fieldEditing id="7.6.2">
        <byType>
          <type name="숫자">숫자 키패드(모바일), 단위 표시(옵션)</type>
          <type name="텍스트/손글씨">텍스트 입력 + 원본 보기(확대 팝오버)</type>
          <type name="체크박스">단일/복수 체크 UI, 전체 해제 제공</type>
        </byType>
        <changeUx>
          <rule>편집 시 변경 전/후 표시(작게)</rule>
          <rule>되돌리기 제공</rule>
        </changeUx>
        <saveMode default="autoSave">
          <rule>상단에 저장됨 토스트</rule>
          <rule>실패 시 재시도</rule>
        </saveMode>
      </fieldEditing>

      <validationRules id="7.6.3">
        <fieldStates>
          <state name="확정">사용자가 확인 완료</state>
          <state name="미확정">신뢰도 낮음 또는 미검수</state>
          <state name="오류">파싱 실패/형식 불일치(예: 숫자 문항에 문자)</state>
        </fieldStates>
        <batchAnalysisGate>
          <rule>미확정 필드가 0이거나</rule>
          <rule>관리자가 미확정 포함 분석 허용을 켠 경우에만 분석 실행 가능(권장)</rule>
        </batchAnalysisGate>
      </validationRules>

      <productivity id="7.6.4">
        <keyboardShortcuts device="desktop">
          <shortcut keys="J/K">다음/이전 필드</shortcut>
          <shortcut keys="N/P">다음/이전 페이지</shortcut>
          <shortcut keys="Enter">확정 토글</shortcut>
          <shortcut keys="Ctrl+Z">마지막 수정 되돌리기</shortcut>
        </keyboardShortcuts>
        <mode>미확정 큐(미확정 항목만 순차 이동)</mode>
      </productivity>

      <mobile>
        <rule>2-pane 전환: 상단 탭(뷰어/필드) 또는 드로어로 필드 패널 표시</rule>
        <rule>썸네일은 하단 슬라이더로 축약</rule>
      </mobile>
    </screen>

    <screen id="7.7" name="통계 분석(실행/결과)">
      <run id="7.7.1" name="분석 실행 화면">
        <targetSelection>프로젝트/배치/엑셀 데이터셋</targetSelection>
        <optionCard name="분석 옵션">
          <optionGroup name="기본 집계">응답자 수, 평균/표준편차</optionGroup>
          <optionGroup name="상관관계">변수 선택(다중), 피어슨/스피어만</optionGroup>
          <optionGroup name="t-test">그룹 변수 선택 + paired 여부 토글</optionGroup>
          <optionGroup name="IPA">중요도/만족도(또는 성과) 매핑 규칙 선택</optionGroup>
        </optionCard>
        <action type="primary">분석 실행</action>
        <validation>
          <rule>최소 표본수 미달 시 경고(Alert)</rule>
          <rule optional="true">실행은 관리자만 허용</rule>
        </validation>
      </run>

      <results id="7.7.2" name="결과 화면(탭 구조)">
        <tabs>
          <tab>요약</tab>
          <tab>상관관계</tab>
          <tab>t-test</tab>
          <tab>IPA</tab>
          <tab>데이터</tab>
        </tabs>
        <tabContent name="요약">
          <kpis>
            <kpi>응답자 수</kpi>
            <kpi>문항 수</kpi>
            <kpi>결측치 비율</kpi>
            <kpi>최종 확정률</kpi>
          </kpis>
          <table>문항별 평균/표준편차/응답 분포(Top/Bottom)</table>
        </tabContent>
        <tabContent name="상관관계">
          <chart>상관 행렬(히트맵)</chart>
          <list>상위 상관 Top10</list>
          <interaction>셀 클릭 시 산점도 + 회귀선(옵션) + 데이터 포인트 수</interaction>
        </tabContent>
        <tabContent name="t-test">
          <table>그룹 A/B(또는 전/후), 평균, 차이, t, p-value, 효과크기(선택)</table>
          <rule>p-value는 임계(0.05) 기준 색상 강조(주의: 과도한 강조 금지, 참고용 문구)</rule>
        </tabContent>
        <tabContent name="IPA">
          <chart>2×2 사분면 차트(중요도 vs 성과)</chart>
          <interaction>점 클릭 시 문항 상세(응답 분포/개선 제안 메모 입력)</interaction>
        </tabContent>
        <tabContent name="데이터">
          <table>정형 데이터 테이블</table>
          <action>엑셀 내보내기</action>
        </tabContent>
      </results>

      <mobile>
        <rule>차트는 세로 스택</rule>
        <rule>표는 가로 스크롤 또는 카드로 전환</rule>
      </mobile>
    </screen>

    <screen id="7.8" name="리포트(문서화/내보내기)">
      <wizard name="리포트 생성(마법사 Stepper)">
        <step index="1">대상 선택(분석 결과 선택)</step>
        <step index="2">템플릿 선택(기본/상세/관리자용)</step>
        <step index="3">포함 항목 선택(요약/상관/t-test/IPA/원자료/부록)</step>
        <step index="4">커버 정보(제목, 기간, 작성자, 로고 업로드(옵션))</step>
        <step index="5">미리보기(페이지 썸네일) + 생성</step>
      </wizard>
      <exportModal size="L" name="내보내기 모달">
        <formats>
          <format>PDF</format>
          <format>PPTX</format>
          <format>XLSX</format>
        </formats>
        <options>
          <option>표 글자 크기</option>
          <option>차트 색상(기본/고대비)</option>
          <option>개인정보 마스킹</option>
        </options>
        <status>진행률 + 완료 시 다운로드 버튼</status>
      </exportModal>
    </screen>

    <screen id="7.9" name="관리자 페이지(권한/검수/정책)" access="adminOnly">
      <usersPermissions name="사용자/권한">
        <tableColumns>
          <col>이름</col>
          <col>이메일</col>
          <col>역할(Admin/Manager/Reviewer/Viewer)</col>
          <col>상태</col>
        </tableColumns>
        <permissionMatrix>읽기/쓰기/삭제/내보내기/관리자</permissionMatrix>
      </usersPermissions>
      <policies name="설문 데이터 검수 정책">
        <policy>미확정 포함 분석 허용(프로젝트 단위)</policy>
        <policy>신뢰도 임계값(예: 0.85 미만은 미확정)</policy>
        <auditLog>사용자/행동/대상/시간/IP</auditLog>
      </policies>
    </screen>
  </section>

  <section id="8" title="반응형/디바이스 규칙(필수)">
    <rule id="8.1" name="사이드바 동작">
      <desktop breakpoint="lgPlus">좌측 고정(폭 264px), 접기 가능(아이콘 모드 80px)</desktop>
      <mobile breakpoint="mdMinus">드로어(오버레이), 메뉴 선택 후 자동 닫힘</mobile>
    </rule>
    <rule id="8.2" name="테이블 변환">
      <mobile breakpoint="smMinus">테이블 → 카드 리스트(핵심 필드 3개 + 더보기)</mobile>
      <exception>데이터 테이블은 가로 스크롤 허용(대신 고정 컬럼 최소화)</exception>
    </rule>
    <rule id="8.3" name="검수 화면">
      <desktop breakpoint="lgPlus">3-pane 유지</desktop>
      <tablet breakpoint="md">2-pane(썸네일 축소 + 우측 패널 탭)</tablet>
      <mobile breakpoint="smMinus">뷰어 단독 + 필드 패널 드로어</mobile>
    </rule>
  </section>

  <section id="9" title="접근성(A11y) / 사용성(필수)">
    <a11y>
      <rule>대비: 텍스트 대비 최소 4.5:1(Body), 큰 텍스트 3:1</rule>
      <rule>키보드: 모든 인터랙션 요소 탭 이동 가능, 포커스 링 항상 표시(--c-focus)</rule>
      <rule>폼: label 연결(for/id), 에러는 aria-describedby로 연결</rule>
      <rule>차트: 요약 테이블(데이터) 제공 + 색상만으로 의미 전달 금지(패턴/레이블 병행)</rule>
      <rule>시간/숫자: 로케일 ko-KR, 천 단위 구분(예: 12,345)</rule>
    </a11y>
  </section>

  <section id="10" title="Figma/개발 핸드오프 규칙(권장)">
    <handoff>
      <rule>컴포넌트 네이밍: Component/Variant/Size/State (예: Button/Primary/M/Loading)</rule>
      <rule>토큰 우선: 색/간격/라운드/그림자는 토큰으로만 지정(하드코딩 금지)</rule>
      <rule>아이콘: 20px(기본), 16px(소), 24px(대) 3종만 사용</rule>
      <rule>스페이싱: 4px 스케일만 사용</rule>
    </handoff>
  </section>

  <section id="11" title="문구(마이크로카피) 규칙(일관성)">
    <microcopy>
      <rule>Primary CTA는 동사로 시작: 업로드 시작, 분석 실행, 리포트 생성</rule>
      <rule>위험 작업은 명확히: 삭제/영구 삭제/되돌릴 수 없음 문구 포함</rule>
      <rule>검수 상태 용어 고정: 확정/미확정/오류</rule>
    </microcopy>
  </section>

  <section id="12" title="체크리스트(구현 완료 기준)">
    <checklist>
      <check id="12.1">모든 입력 요소: focus/disabled/error 상태 구현</check>
      <check id="12.2">OCR 검수: 원본 하이라이트와 필드 동기화 구현</check>
      <check id="12.3">비동기 Job: 진행률/완료 알림/재시도 제공</check>
      <check id="12.4">분석 결과: 표 + 차트 동시 제공(모바일 포함)</check>
      <check id="12.5">내보내기: 포맷 선택 + 생성 상태 + 다운로드 동작</check>
      <check id="12.6">접근성: 키보드 네비게이션/대비/폼 라벨 준수</check>
    </checklist>
  </section>
</uiuxSpec>
```

