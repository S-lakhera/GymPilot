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
        <TabsContent value="details" forceMount>Details Content</TabsContent>
        <TabsContent value="security" forceMount>Security Content</TabsContent>
      </Tabs>
    );

    const detailsTab = screen.getByRole('tab', { name: 'Details' });
    const securityTab = screen.getByRole('tab', { name: 'Security' });

    expect(detailsTab).toHaveAttribute('aria-selected', 'true');
    expect(detailsTab).toHaveAttribute('tabIndex', '0');
    expect(detailsTab).toHaveAttribute('aria-controls');

    // Inactive tab trigger must also have aria-controls referencing its corresponding panel
    expect(securityTab).toHaveAttribute('aria-selected', 'false');
    expect(securityTab).toHaveAttribute('tabIndex', '-1');
    expect(securityTab).toHaveAttribute('aria-controls');

    const panels = screen.getAllByRole('tabpanel', { hidden: true });
    expect(panels[0]).toHaveAttribute('id', detailsTab.getAttribute('aria-controls'));
    expect(panels[0]).toHaveAttribute('aria-labelledby', detailsTab.id);

    expect(panels[1]).toHaveAttribute('id', securityTab.getAttribute('aria-controls'));
    expect(panels[1]).toHaveAttribute('aria-labelledby', securityTab.id);
  });

  it('navigates horizontal tabs using ArrowRight, ArrowLeft, Home, and End with wrapping', () => {
    render(
      <Tabs defaultValue="first" orientation="horizontal">
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

    // Home -> Jumps to First
    fireEvent.keyDown(thirdTab, { key: 'Home' });
    expect(document.activeElement).toBe(firstTab);
    expect(firstTab).toHaveAttribute('aria-selected', 'true');

    // End -> Jumps to Third
    fireEvent.keyDown(firstTab, { key: 'End' });
    expect(document.activeElement).toBe(thirdTab);
    expect(thirdTab).toHaveAttribute('aria-selected', 'true');

    // Up/Down should be ignored in horizontal orientation
    fireEvent.keyDown(thirdTab, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(thirdTab);
  });

  it('navigates vertical tabs using ArrowDown and ArrowUp only', () => {
    render(
      <Tabs defaultValue="first" orientation="vertical">
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

    // ArrowLeft / ArrowRight ignored in vertical mode
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(firstTab);

    // ArrowDown -> Second
    fireEvent.keyDown(firstTab, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(secondTab);
    expect(secondTab).toHaveAttribute('aria-selected', 'true');

    // ArrowUp -> First
    fireEvent.keyDown(secondTab, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(firstTab);
    expect(firstTab).toHaveAttribute('aria-selected', 'true');
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
