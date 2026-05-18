import { describe, expect, it } from 'vitest';
import osName from '../../../lib/utils/os-info.utils.js';

describe('osName', () => {
  it('should return "macOS" for darwin with release > 15', () => {
    expect(osName('darwin', '16.0.0')).toBe('macOS');
  });

  it('should return "macOS" for darwin with release 22 (Ventura)', () => {
    expect(osName('darwin', '22.1.0')).toBe('macOS');
  });

  it('should return "OS X" for darwin with release <= 15', () => {
    expect(osName('darwin', '15.0.0')).toBe('OS X');
  });

  it('should return "OS X" for darwin with release 14', () => {
    expect(osName('darwin', '14.5.0')).toBe('OS X');
  });

  it('should return "Linux" for linux platform', () => {
    expect(osName('linux', '5.15.0')).toBe('Linux');
  });

  it('should return "Windows" for win32 platform', () => {
    expect(osName('win32', '10.0.19041')).toBe('Windows');
  });

  it('should return "FreeBSD" for freebsd platform', () => {
    expect(osName('freebsd', '13.0')).toBe('FreeBSD');
  });

  it('should return "OpenBSD" for openbsd platform', () => {
    expect(osName('openbsd', '7.0')).toBe('OpenBSD');
  });

  it('should return "Solaris" for sunos platform', () => {
    expect(osName('sunos', '5.11')).toBe('Solaris');
  });

  it('should return "Android" for android platform', () => {
    expect(osName('android', '11')).toBe('Android');
  });

  it('should return the platform string for unknown platforms', () => {
    expect(osName('aix', '7.2')).toBe('aix');
  });

  it('should return the platform string for empty platform', () => {
    expect(osName('', '1.0')).toBe('');
  });
});
