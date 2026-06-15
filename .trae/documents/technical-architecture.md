## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["React 18 + TypeScript"]
        B["Tailwind CSS"]
        C["React Router v6"]
        D["Zustand 状态管理"]
        E["Recharts 图表库"]
    end

    subgraph "数据层"
        F["Mock 数据服务"]
        G["Zustand Store"]
        H["LocalStorage 持久化"]
    end

    subgraph "工具层"
        I["日期处理 date-fns"]
        J["图标库 lucide-react"]
        K["UUID 生成器"]
    end

    A --> C
    A --> D
    A --> E
    A --> B
    D --> G
    G --> H
    F --> G
    A --> I
    A --> J
    A --> K
```

## 2. 技术说明

- **前端**：React@18 + TypeScript + Tailwind CSS@3 + Vite
- **初始化工具**：vite-init
- **后端**：无（纯前端项目，使用 Mock 数据）
- **数据库**：无（使用 Zustand Store + LocalStorage 模拟数据持久化）
- **路由**：React Router v6
- **状态管理**：Zustand
- **图表**：Recharts（指标趋势图）
- **图标**：lucide-react
- **日期处理**：date-fns

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| `/` | 重定向到患者列表页 |
| `/patients` | 患者列表页：搜索筛选、患者卡片、建档、标签管理、异常预警 |
| `/consultation/:patientId` | 问诊室页：视频问诊、文字咨询、图片上传、处方建议、转诊建议 |
| `/records/:patientId` | 病历页：时间线、病历详情、历史筛选 |
| `/examinations/:patientId` | 检查资料页：报告列表、上传、详情、整理 |
| `/medications/:patientId` | 用药页：用药清单、提醒、处方记录、交互提示 |
| `/followup/:patientId` | 随访计划页：随访问卷、预约复诊、指标趋势图、异常预警、教育资料 |
| `/messages` | 消息页：系统通知、问诊消息、转诊通知、费用确认、服务评价 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    Patient {
        string id PK
        string name
        string gender
        string birthDate
        string phone
        string idCard
        string[] tags
        string allergy
        string pastHistory
        string createdAt
        string updatedAt
    }

    Consultation {
        string id PK
        string patientId FK
        string doctorId FK
        string type
        string status
        string startedAt
        string endedAt
    }

    Message {
        string id PK
        string consultationId FK
        string senderId
        string senderRole
        string content
        string type
        string createdAt
    }

    MedicalRecord {
        string id PK
        string patientId FK
        string doctorId FK
        string chiefComplaint
        string presentIllness
        string pastIllness
        string diagnosis
        string treatmentPlan
        string createdAt
    }

    Examination {
        string id PK
        string patientId FK
        string type
        string name
        string date
        string[] imageUrls
        string reportUrl
        boolean isAbnormal
        string notes
        boolean isImportant
        string createdAt
    }

    Medication {
        string id PK
        string patientId FK
        string name
        string dosage
        string frequency
        string startDate
        string endDate
        string status
        string prescribedBy FK
    }

    MedicationReminder {
        string id PK
        string medicationId FK
        string patientId FK
        string time
        boolean enabled
    }

    Prescription {
        string id PK
        string patientId FK
        string doctorId FK
        string consultationId FK
        string medications
        string notes
        string createdAt
    }

    FollowupPlan {
        string id PK
        string patientId FK
        string doctorId FK
        string nextDate
        string frequency
        string status
    }

    FollowupQuestionnaire {
        string id PK
        string planId FK
        string patientId FK
        string title
        string questions
        string answers
        string status
        string createdAt
    }

    HealthIndicator {
        string id PK
        string patientId FK
        string name
        number value
        string unit
        string recordedAt
        boolean isAbnormal
        number upperLimit
        number lowerLimit
    }

    Referral {
        string id PK
        string patientId FK
        string fromDoctorId FK
        string toDoctorId FK
        string reason
        string status
        string createdAt
    }

    PatientEducation {
        string id PK
        string title
        string content
        string category
        string[] tags
        string createdAt
    }

    FeeRecord {
        string id PK
        string patientId FK
        string consultationId FK
        number amount
        string status
        string createdAt
    }

    ServiceRating {
        string id PK
        string patientId FK
        string consultationId FK
        number rating
        string comment
        string[] tags
        string createdAt
    }

    Notification {
        string id PK
        string userId FK
        string type
        string title
        string content
        boolean isRead
        string createdAt
    }

    Patient ||--o{ Consultation : "拥有"
    Patient ||--o{ MedicalRecord : "拥有"
    Patient ||--o{ Examination : "拥有"
    Patient ||--o{ Medication : "使用"
    Patient ||--o{ FollowupPlan : "绑定"
    Patient ||--o{ HealthIndicator : "记录"
    Patient ||--o{ Referral : "发起"
    Patient ||--o{ FeeRecord : "产生"
    Patient ||--o{ ServiceRating : "提交"
    Patient ||--o{ Notification : "接收"
    Consultation ||--o{ Message : "包含"
    Consultation ||--o{ Prescription : "产生"
    Medication ||--o{ MedicationReminder : "设置"
    FollowupPlan ||--o{ FollowupQuestionnaire : "关联"
```

## 5. 项目目录结构

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── AppLayout.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Tabs.tsx
│   │   └── Avatar.tsx
│   └── shared/
│       ├── PatientCard.tsx
│       ├── HealthTrendChart.tsx
│       ├── AbnormalIndicator.tsx
│       └── ImageUploader.tsx
├── pages/
│   ├── Patients.tsx
│   ├── Consultation.tsx
│   ├── MedicalRecords.tsx
│   ├── Examinations.tsx
│   ├── Medications.tsx
│   ├── FollowupPlan.tsx
│   └── Messages.tsx
├── stores/
│   ├── patientStore.ts
│   ├── consultationStore.ts
│   ├── medicationStore.ts
│   ├── followupStore.ts
│   └── notificationStore.ts
├── data/
│   └── mockData.ts
├── types/
│   └── index.ts
├── hooks/
│   ├── usePatient.ts
│   └── useConsultation.ts
├── utils/
│   ├── date.ts
│   └── format.ts
├── App.tsx
├── main.tsx
└── index.css
```
