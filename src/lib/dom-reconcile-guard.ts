'use client';

/**
 * Android WebView / translate / maps widgets sometimes move or wrap text nodes.
 * React 19 then throws NotFoundError on removeChild/insertBefore during commit.
 * Swallow only that mismatch so the tree can keep going.
 */
export function installDomReconcileGuard() {
  if (typeof window === 'undefined' || typeof Node === 'undefined') return;
  const w = window as Window & { __oigaDomReconcileGuard?: boolean };
  if (w.__oigaDomReconcileGuard) return;
  w.__oigaDomReconcileGuard = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) return child;
    try {
      return originalRemoveChild.call(this, child) as T;
    } catch {
      return child;
    }
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    try {
      return originalInsertBefore.call(this, newNode, referenceNode) as T;
    } catch {
      return newNode;
    }
  };
}

installDomReconcileGuard();
