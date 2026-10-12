import { useCallback, useEffect, useMemo, useState } from 'react';
import { Layouts, useFetchClient } from '@strapi/strapi/admin';
import {
  Badge,
  Box,
  Button,
  Flex,
  SingleSelect,
  SingleSelectOption,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Typography,
} from '@strapi/design-system';

type Status = 'new' | 'in_progress' | 'done' | 'spam';

interface Lead {
  documentId: string;
  createdAt: string;
  name: string | null;
  phone: string;
  comment: string | null;
  source_path: string | null;
  source_title: string | null;
  lead_status: Status;
  lead_source: 'viewing' | 'quiz' | 'landing';
  messenger: 'telegram' | 'max' | 'call' | null;
  landing: string | null;
  utm: Record<string, string> | null;
  quiz_answers: Record<string, unknown> | null;
}

interface ListResponse {
  results: Lead[];
  pagination?: { total: number };
}

const STATUS_LABEL: Record<Status, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Завершена',
  spam: 'Спам',
};

const SOURCE_LABEL: Record<Lead['lead_source'], string> = {
  viewing: 'Запись на просмотр',
  quiz: 'Квиз на сайте',
  landing: 'Посадочная (реклама)',
};

const MESSENGER_LABEL: Record<string, string> = { telegram: 'Telegram', max: 'MAX', call: 'Звонок' };

const ANSWER_LABEL: Record<string, string> = {
  goal: 'Цель',
  rooms: 'Комнат',
  down: 'Взнос',
  budget: 'Бюджет',
  matkap: 'Маткапитал',
  term: 'Срок',
};

const FILTERS: { key: 'all' | Status; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'in_progress', label: 'В работе' },
  { key: 'done', label: 'Завершённые' },
  { key: 'spam', label: 'Спам' },
];

const REFRESH_MS = 30_000;

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Yekaterinburg',
  }).format(new Date(iso));
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length !== 11) return phone;
  return `+7 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}`;
}

function answersText(answers: Lead['quiz_answers']): string {
  if (!answers) return '';
  return Object.entries(answers)
    .filter(([, v]) => v !== null && v !== undefined && v !== '' && typeof v !== 'object')
    .map(([k, v]) => `${ANSWER_LABEL[k] ?? k}: ${typeof v === 'number' ? v.toLocaleString('ru-RU') : v}`)
    .join(' · ');
}

const LeadsPage = () => {
  const { get, put } = useFetchClient();
  const [filter, setFilter] = useState<'all' | Status>('new');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page: 1, pageSize: 100, sort: 'createdAt:desc' };
      if (filter !== 'all') params.filters = { lead_status: { $eq: filter } };
      const [list, fresh] = await Promise.all([
        get<ListResponse>('/content-manager/collection-types/api::lead.lead', { params }),
        get<ListResponse>('/content-manager/collection-types/api::lead.lead', {
          params: { page: 1, pageSize: 1, filters: { lead_status: { $eq: 'new' } } },
        }),
      ]);
      setLeads(list.data.results);
      setTotal(list.data.pagination?.total ?? list.data.results.length);
      setNewCount(fresh.data.pagination?.total ?? 0);
      setError(null);
    } catch {
      setError('Не удалось загрузить заявки. Обновите страницу.');
    } finally {
      setLoading(false);
    }
  }, [get, filter]);

  useEffect(() => {
    setLoading(true);
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function changeStatus(lead: Lead, next: Status) {
    setLeads((prev) => prev.map((l) => (l.documentId === lead.documentId ? { ...l, lead_status: next } : l)));
    try {
      await put(`/content-manager/collection-types/api::lead.lead/${lead.documentId}`, { lead_status: next });
      void load();
    } catch {
      setError('Не удалось сменить статус. Попробуйте ещё раз.');
      void load();
    }
  }

  const subtitle = useMemo(() => {
    if (loading) return 'Загружаю…';
    return `Показано ${leads.length} из ${total}. Обновляется само раз в полминуты.`;
  }, [loading, leads.length, total]);

  return (
    <Layouts.Root>
      <Layouts.Header
        title={newCount ? `Заявки · новых: ${newCount}` : 'Заявки'}
        subtitle={subtitle}
        primaryAction={
          <Button variant="secondary" onClick={() => void load()}>
            Обновить
          </Button>
        }
      />
      <Layouts.Content>
        <Flex gap={2} marginBottom={4} wrap="wrap">
          {FILTERS.map((f) => (
            <Button key={f.key} variant={filter === f.key ? 'default' : 'tertiary'} onClick={() => setFilter(f.key)}>
              {f.label}
            </Button>
          ))}
        </Flex>

        {error ? (
          <Box marginBottom={4}>
            <Typography textColor="danger600">{error}</Typography>
          </Box>
        ) : null}

        {!loading && leads.length === 0 ? (
          <Box padding={8} background="neutral0" hasRadius shadow="filterShadow">
            <Typography textColor="neutral600">В этой вкладке заявок пока нет.</Typography>
          </Box>
        ) : (
          <Table colCount={5} rowCount={leads.length}>
            <Thead>
              <Tr>
                <Th>
                  <Typography variant="sigma">Когда</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Клиент</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Откуда</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Что хочет</Typography>
                </Th>
                <Th>
                  <Typography variant="sigma">Статус</Typography>
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {leads.map((lead) => {
                const answers = answersText(lead.quiz_answers);
                const term = lead.utm?.utm_term;
                return (
                  <Tr key={lead.documentId}>
                    <Td>
                      <Typography>{formatDate(lead.createdAt)}</Typography>
                    </Td>
                    <Td>
                      <Flex direction="column" alignItems="flex-start" gap={1}>
                        {lead.name ? <Typography fontWeight="bold">{lead.name}</Typography> : null}
                        <a href={`tel:${lead.phone}`}>
                          <Typography textColor="primary600" fontWeight="bold">
                            {formatPhone(lead.phone)}
                          </Typography>
                        </a>
                        {lead.messenger ? (
                          <Badge>{`Связаться: ${MESSENGER_LABEL[lead.messenger]}`}</Badge>
                        ) : null}
                      </Flex>
                    </Td>
                    <Td>
                      <Flex direction="column" alignItems="flex-start" gap={1}>
                        <Typography>{SOURCE_LABEL[lead.lead_source]}</Typography>
                        {lead.landing ? <Typography textColor="neutral600">{`/lp/${lead.landing}`}</Typography> : null}
                        {!lead.landing && lead.source_path ? (
                          <Typography textColor="neutral600">{lead.source_path}</Typography>
                        ) : null}
                        {lead.utm?.utm_campaign ? (
                          <Typography textColor="neutral600" variant="pi">{`кампания: ${lead.utm.utm_campaign}`}</Typography>
                        ) : null}
                      </Flex>
                    </Td>
                    <Td>
                      <Flex direction="column" alignItems="flex-start" gap={1}>
                        {answers ? <Typography>{answers}</Typography> : null}
                        {term ? <Typography textColor="neutral600">{`Запрос в Директе: ${term}`}</Typography> : null}
                        {lead.comment ? <Typography>{lead.comment}</Typography> : null}
                        {!answers && !term && !lead.comment ? <Typography textColor="neutral500">—</Typography> : null}
                      </Flex>
                    </Td>
                    <Td>
                      <SingleSelect
                        aria-label="Статус заявки"
                        value={lead.lead_status}
                        onChange={(value: string | number) => void changeStatus(lead, String(value) as Status)}
                      >
                        {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                          <SingleSelectOption key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </SingleSelectOption>
                        ))}
                      </SingleSelect>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </Layouts.Content>
    </Layouts.Root>
  );
};

export default LeadsPage;
