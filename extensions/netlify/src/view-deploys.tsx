import { Action, ActionPanel, Icon, List } from '@raycast/api';
import { useEffect, useState } from 'react';

import api from './api';
import { Deploy } from './interfaces';
import {
  formatDate,
  getDeployUrl,
  getStatusIcon,
  handleNetworkError,
} from './utils';

interface Props {
  siteId: string;
  siteName: string;
}

export function DeployListView(props: Props) {
  const [deploys, setDeploys] = useState<Deploy[]>([]);
  const [isLoading, setLoading] = useState<boolean>(true);

  const { siteId, siteName } = props;

  useEffect(() => {
    async function fetchDeploys() {
      try {
        const deploys = await api.getDeploys(siteId);
        setDeploys(deploys);
        setLoading(false);
      } catch (e) {
        setLoading(false);
        handleNetworkError(e);
      }
    }

    fetchDeploys();
  }, []);

  return (
    <List
      isLoading={isLoading}
      isShowingDetail
      navigationTitle={`Deploys: ${siteName}`}
      searchBarPlaceholder="Filter recent deploys by id, title, author, number, branch, sha..."
    >
      {deploys.map((deploy) => (
        <List.Item
          key={deploy.id}
          icon={getStatusIcon(deploy.state)}
          title={deploy.title || deploy.commit_ref || deploy.id}
          keywords={[
            deploy.id,
            deploy.branch || '',
            deploy.committer || '',
            String(deploy.review_id),
            String(deploy.commit_ref),
          ]}
          detail={<DeployMetadata deploy={deploy} />}
          actions={<DeployActions deploy={deploy} siteName={siteName} />}
        />
      ))}
    </List>
  );
}

const DeployMetadata = ({ deploy }: { deploy: Deploy }) => (
  <List.Item.Detail
    metadata={
      <List.Item.Detail.Metadata>
        {deploy.state && (
          <>
            <List.Item.Detail.Metadata.TagList title="Deploy state">
              <List.Item.Detail.Metadata.TagList.Item
                text={deploy.state.toUpperCase()}
                color={getStatusIcon(deploy.state).tintColor}
                // icon={getStatusIcon(deploy.state).icon}
              />
            </List.Item.Detail.Metadata.TagList>
            <List.Item.Detail.Metadata.Separator />
          </>
        )}
        <List.Item.Detail.Metadata.Label
          title={deploy.review_url ? 'Pull request title' : 'Commit message'}
          text={deploy.title || deploy.commit_ref || deploy.id}
        />
        {deploy.review_url ? (
          <List.Item.Detail.Metadata.Label
            title="Pull request URL"
            text={deploy.review_url}
          />
        ) : (
          <List.Item.Detail.Metadata.Label
            title="Commit URL"
            text={deploy.commit_url || ''}
          />
        )}
        {deploy.committer && (
          <List.Item.Detail.Metadata.Label
            title="Author"
            text={deploy.committer}
          />
        )}
        {deploy.commit_ref && (
          <List.Item.Detail.Metadata.Label
            title="Git ref"
            text={`${deploy.branch}@${deploy.commit_ref.substr(0, 7)}`}
          />
        )}
        <List.Item.Detail.Metadata.Separator />
        {deploy.context && (
          <List.Item.Detail.Metadata.Label
            title="Deploy context"
            text={deploy.context}
          />
        )}
        <List.Item.Detail.Metadata.Label title="Deploy ID" text={deploy.id} />
        <List.Item.Detail.Metadata.Label
          title={
            deploy.context === 'deploy-preview' ? 'Deploy Preview' : 'Permalink'
          }
          text={
            deploy.context === 'deploy-preview'
              ? deploy.deploy_ssl_url
              : deploy.links.permalink
          }
        />
        <List.Item.Detail.Metadata.Label
          title="Deployed at"
          text={formatDate(new Date(deploy.updated_at))}
        />
        {deploy.deploy_time && (
          <List.Item.Detail.Metadata.Label
            title="Deploy duration"
            text={`${deploy.deploy_time} seconds`}
          />
        )}
      </List.Item.Detail.Metadata>
    }
  />
);

const DeployActions = ({
  deploy,
  siteName,
}: {
  deploy: Deploy;
  siteName: string;
}) => (
  <ActionPanel>
    <Action.OpenInBrowser
      icon={Icon.AppWindowList}
      title="View Deploy Logs"
      url={getDeployUrl(siteName, deploy.id)}
    />
    <Action.CopyToClipboard
      content={deploy.id}
      shortcut={{ key: 'i', modifiers: ['cmd'] }}
      title="Copy Deploy ID"
    />
    <Action.OpenInBrowser
      icon={Icon.Link}
      shortcut={{ key: 'u', modifiers: ['cmd'] }}
      title={
        deploy.context === 'deploy-preview'
          ? 'Go to Deploy Preview'
          : 'Go to Permalink'
      }
      url={
        deploy.context === 'production'
          ? deploy.links.permalink
          : deploy.deploy_ssl_url
      }
    />
    {deploy.review_url && (
      <Action.OpenInBrowser
        icon={Icon.CodeBlock}
        shortcut={{ key: 'r', modifiers: ['cmd'] }}
        title="Go to Pull Request"
        url={deploy.review_url}
      />
    )}
  </ActionPanel>
);
