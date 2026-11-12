import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs.jsx';

describe('Tabs Component WAI-ARIA and Keyboard Navigation', () => {
  it('renders tabs with accessible IDs, aria-controls, and aria-labelledby', () => {
    render(
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="details">Details Content</TabsContent>
        <TabsContent value="security">Security Content</TabsContent>
      </Tabs>
    );

    const detailsTab = screen.getByRole('tab', { name: 'Details' });
    const securityTab = screen.getByRole('tab', { name: 'Security' });

    expect(detailsTab).toHaveAttribute('aria-selected', 'true');
    expect(detailsTab).toHaveAttribute('tabIndex', '0');
    expect(detailsTab).toHaveAttribute('aria-controls');

    expect(securityTab).toHaveAttribute('aria-selected', 'false');
    expect(securityTab).toHaveAttribute('tabIndex', '-1');
    expect(securityTab).not.toHaveAttribute('aria-controls');

    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('aria-labelledby', detailsTab.id);
  });

  it('navigates between tabs using ArrowRight and ArrowLeft with wrapping', () => {
    render(
      <Tabs defaultValue="first">
        <TabsList>
          <TabsTrigger value="first">First</TabsTrigger>
          <TabsTrigger value="second">Second</TabsTrigger>
          <TabsTrigger value="third">Third</TabsTrigger>
        </TabsList>
        <TabsContent value="first">First Content</TabsContent>
        <TabsContent value="second">Second Content</TabsContent>
        <TabsContent value="third">Third Content</TabsContent>
      </Tabs>
    );

    const firstTab = screen.getByRole('tab', { name: 'First' });
    const secondTab = screen.getByRole('tab', { name: 'Second' });
    const thirdTab = screen.getByRole('tab', { name: 'Third' });

    firstTab.focus();
    expect(document.activeElement).toBe(firstTab);

    // ArrowRight -> Second
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(secondTab);
    expect(secondTab).toHaveAttribute('aria-selected', 'true');

    // ArrowRight -> Third
    fireEvent.keyDown(secondTab, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(thirdTab);
    expect(thirdTab).toHaveAttribute('aria-selected', 'true');

    // ArrowRight -> Wraps to First
    fireEvent.keyDown(thirdTab, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(firstTab);
    expect(firstTab).toHaveAttribute('aria-selected', 'true');

    // ArrowLeft -> Wraps to Third
    fireEvent.keyDown(firstTab, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(thirdTab);
    expect(thirdTab).toHaveAttribute('aria-selected', 'true');
  });

  it('preserves inactive tab panel in DOM when forceMount is true', () => {
    render(
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="details" forceMount>
          <input data-testid="details-input" defaultValue="draft details" />
        </TabsContent>
        <TabsContent value="security" forceMount>
          <input data-testid="security-input" defaultValue="draft password" />
        </TabsContent>
      </Tabs>
    );

    const detailsInput = screen.getByTestId('details-input');
    const securityInput = screen.getByTestId('security-input');

    expect(detailsInput).toBeVisible();
    expect(securityInput).not.toBeVisible();

    // Switch to Security
    fireEvent.click(screen.getByRole('tab', { name: 'Security' }));

    expect(detailsInput).not.toBeVisible();
    expect(securityInput).toBeVisible();
    expect(detailsInput.value).toBe('draft details');
  });
});
