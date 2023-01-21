import { ActionPanel, Action, Detail, List } from '@raycast/api';
import { useCachedState } from '@raycast/utils';
import { useEffect, useState } from 'react';

import { OpenOnNetlify } from './components/actions';
import TeamDropdown from './components/team-dropdown';
import api from './utils/api';
import { formatDate, handleNetworkError } from './utils/helpers';
import { getIconForAuditLogPayload } from './utils/icons';
import { AuditLog, Team } from './utils/interfaces';

export default function Command() {
  const [isLoading, setLoading] = useState<boolean>(true);

  const [teams, setTeams] = useState<Team[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);

  const [query, setQuery] = useState<string>('');
  const [teamSlug, setTeamSlug] = useCachedState<string>('teamSlug', '');

  async function fetchAuditLog(team: string) {
    setLoading(true);
    try {
      const auditLog = await api.getAuditLog(team);
      setAuditLog(auditLog);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      handleNetworkError(e);
    }
  }

  async function fetchTeams() {
    setLoading(true);
    try {
      const teams = await api.getTeams();
      setTeams(teams);
      if (teams.length === 1 || !teamSlug) {
        setTeamSlug(teams[0].slug);
      }
      setLoading(false);
    } catch (e) {
      setLoading(false);
      handleNetworkError(e);
    }
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (teamSlug) {
      fetchAuditLog(teamSlug);
    }
  }, [teamSlug]);

  const teamDropdown = (
    <TeamDropdown
      required
      teamSlug={teamSlug}
      setTeamSlug={setTeamSlug}
      teams={teams}
    />
  );

  const filteredAuditLog = auditLog.filter((log) => {
    const keywords = [
      log.payload.action || '',
      log.payload.actor_name || '',
      JSON.stringify(log.payload.traits || {}),
    ];
    return keywords.some((keyword) =>
      keyword.toLowerCase().includes(query.toLowerCase()),
    );
  });

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setQuery}
      searchBarAccessory={teams.length > 1 ? teamDropdown : undefined}
      searchBarPlaceholder="Filter recent audit log entries"
      searchText={query}
    >
      {filteredAuditLog.length === 0 && (
        <List.EmptyView
          title="No audit log found"
          description="Your team's plan may not have audit log capabilities."
        />
      )}
      <List.Section title="Audit log">
        {filteredAuditLog
          .sort((a, b) =>
            new Date(a.payload.timestamp) < new Date(b.payload.timestamp)
              ? 1
              : -1,
          )
          .map((log) => (
            <List.Item
              key={log.id}
              icon={getIconForAuditLogPayload(log.payload)}
              title={log.payload.action}
              subtitle={log.payload.actor_name}
              accessories={[
                {
                  text: formatDate(log.payload.timestamp),
                },
              ]}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="Show Audit Log"
                    target={
                      <AuditLogDetail
                        json={JSON.stringify(log.payload.traits, null, 2)}
                        payload={log.payload}
                        teamSlug={teamSlug}
                      />
                    }
                  />
                </ActionPanel>
              }
            />
          ))}
      </List.Section>
    </List>
  );
}

const AuditLogDetail = ({
  json,
  payload,
  teamSlug,
}: {
  json: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  teamSlug: string;
}) => {
  const markdown = `
\`\`\`json
${json}
\`\`\`
`;

  const url = `https://app.netlify.com/teams/${teamSlug}/log`;
  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Action" text={payload.action} />
          {payload.actor_name && (
            <Detail.Metadata.Label title="Actor" text={payload.actor_name} />
          )}
          <Detail.Metadata.Label
            title="Date"
            text={formatDate(payload.timestamp)}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Link
            title="More details"
            target={url}
            text="Open Audit Log on Netlify"
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <OpenOnNetlify url={url} />
        </ActionPanel>
      }
    />
  );
};
