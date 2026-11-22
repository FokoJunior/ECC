# Agent Orkestrasyonu

## Mevcut Agent'lar

Junior Dev agent'ları `junior-dev@junior-dev` eklentisiyle birlikte gelir, `~/.claude/agents/` dizininde bulunmaz.
Agent aracıyla eklenti kapsamlı bir `subagent_type` ile çağrılır:

```text
Agent(subagent_type: "junior-dev:planner", prompt: "...")
```

| Agent | Amaç | Ne Zaman Kullanılır |
|-------|---------|-------------|
| junior-dev:planner | Uygulama planlaması | Karmaşık özellikler, refactoring |
| junior-dev:architect | Sistem tasarımı | Mimari kararlar |
| junior-dev:tdd-guide | Test odaklı geliştirme | Yeni özellikler, hata düzeltmeleri |
| junior-dev:code-reviewer | Kod incelemesi | Kod yazdıktan sonra |
| junior-dev:security-reviewer | Güvenlik analizi | Commit'lerden önce |
| junior-dev:build-error-resolver | Build hatalarını düzeltme | Build başarısız olduğunda |
| junior-dev:e2e-runner | E2E testleri | Kritik kullanıcı akışları |
| junior-dev:refactor-cleaner | Ölü kod temizliği | Kod bakımı |
| junior-dev:doc-updater | Dokümantasyon | Dokümanları güncelleme |
| junior-dev:rust-reviewer | Rust kod incelemesi | Rust projeleri |

68 agent'ın tam listesi için `/junior-dev:junior-dev-guide` bölümüne bakın.

## Anlık Agent Kullanımı

Kullanıcı istemi gerekmez:
1. Karmaşık özellik istekleri - **junior-dev:planner** agent kullan
2. Kod yeni yazıldı/değiştirildi - **junior-dev:code-reviewer** agent kullan
3. Hata düzeltmesi veya yeni özellik - **junior-dev:tdd-guide** agent kullan
4. Mimari karar - **junior-dev:architect** agent kullan

## Paralel Görev Yürütme

Bağımsız işlemler için DAIMA paralel Task yürütme kullan:

```markdown
# İYİ: Paralel yürütme
3 agent'ı paralel başlat:
1. Agent 1: Auth modülü güvenlik analizi
2. Agent 2: Cache sistemi performans incelemesi
3. Agent 3: Utilities tip kontrolü

# KÖTÜ: Gereksiz sıralı yürütme
Önce agent 1, sonra agent 2, sonra agent 3
```

## Çok Perspektifli Analiz

Karmaşık problemler için split role sub-agent'lar kullan:
- Factual reviewer
- Senior engineer
- Security expert
- Consistency reviewer
- Redundancy checker
