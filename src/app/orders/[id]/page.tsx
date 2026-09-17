'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import MapsPollutionNuke from '@/components/maps/MapsPollutionNuke';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import { parseCustomFields } from '@/lib/utils';
import OrderServiceDetails from '@/components/orders/OrderServiceDetails';
import GoogleMap from '@/components/maps/GoogleMap';
