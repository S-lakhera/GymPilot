import { useState, useEffect, useCallback, useRef } from 'react';
import { coachingApi } from '../api/coachingApi.js';
import { useAuth } from './useAuth.js';
import { useToast } from './useToast.js';
import { USER_ROLES } from '../utils/constants.js';

export function useCoaching(initialParams = {}) {
  const { role, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const loadGenRef = useRef(0);

  const fetchCoachingData = useCallback(async () => {
    if (!isAuthenticated) return;
    const currentGen = ++loadGenRef.current;
    setIsLoading(true);
    setError(null);

    try {
      let resultData = null;
      let trainersList = [];

      if (role === USER_ROLES.MEMBER) {
        const [statusRes, trainersRes] = await Promise.all([
          coachingApi.getMemberStatus(),
          coachingApi.getTrainersWithCapacity(),
        ]);
        resultData = statusRes;
        trainersList = trainersRes;
      } else if (role === USER_ROLES.TRAINER) {
        const rosterRes = await coachingApi.getTrainerRoster(initialParams);
        resultData = rosterRes;
      } else if (role === USER_ROLES.ADMIN) {
        const overviewRes = await coachingApi.getAdminOverview(initialParams);
        resultData = overviewRes;
        trainersList = overviewRes.trainers || [];
      }

      if (currentGen === loadGenRef.current) {
        setData(resultData);
        setTrainers(trainersList);
        setError(null);
      }
    } catch (err) {
      if (currentGen === loadGenRef.current) {
        const errorMsg = err.message || 'Failed to load coaching information.';
        setError(errorMsg);
      }
    } finally {
      if (currentGen === loadGenRef.current) {
        setIsLoading(false);
      }
    }
  }, [role, isAuthenticated, JSON.stringify(initialParams)]);

  useEffect(() => {
    fetchCoachingData();
  }, [fetchCoachingData]);

  // Member Action: Request Coach
  const requestCoach = async ({ trainerId, notes = '' }) => {
    setIsSubmitting(true);
    try {
      const res = await coachingApi.requestTrainer({ trainerId, notes });
      showToast({
        type: 'success',
        message: 'Coaching request submitted to the coach and sent for Admin confirmation!',
      });
      await fetchCoachingData();
      return res;
    } catch (err) {
      showToast({
        type: 'danger',
        message: err.message || 'Failed to submit coaching request.',
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Member Action: Cancel Request
  const cancelCoachRequest = async (requestId) => {
    setIsSubmitting(true);
    try {
      await coachingApi.cancelRequest(requestId);
      showToast({
        type: 'info',
        message: 'Coaching request cancelled.',
      });
      await fetchCoachingData();
    } catch (err) {
      showToast({
        type: 'danger',
        message: err.message || 'Failed to cancel request.',
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Action: Review Request
  const reviewCoachRequest = async (requestId, { action, rejectionReason = null, overrideCapacity = false }) => {
    setIsSubmitting(true);
    try {
      const res = await coachingApi.reviewRequest(requestId, { action, rejectionReason, overrideCapacity });
      showToast({
        type: 'success',
        message: action === 'APPROVE' ? 'Request approved and member assigned!' : 'Request rejected.',
      });
      await fetchCoachingData();
      return res;
    } catch (err) {
      showToast({
        type: 'danger',
        message: err.message || 'Failed to process request.',
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Action: Direct Assignment or Reassignment
  const assignCoach = async ({ memberId, trainerId, notes = '', overrideCapacity = false }) => {
    setIsSubmitting(true);
    try {
      const res = await coachingApi.assignTrainerDirectly({ memberId, trainerId, notes, overrideCapacity });
      showToast({
        type: 'success',
        message: 'Coach assigned to member successfully.',
      });
      await fetchCoachingData();
      return res;
    } catch (err) {
      showToast({
        type: 'danger',
        message: err.message || 'Failed to assign coach.',
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Action: Terminate Assignment
  const terminateCoachAssignment = async (assignmentId, { reason, notes = '' }) => {
    setIsSubmitting(true);
    try {
      await coachingApi.terminateAssignment(assignmentId, { reason, notes });
      showToast({
        type: 'info',
        message: 'Coaching assignment terminated.',
      });
      await fetchCoachingData();
    } catch (err) {
      showToast({
        type: 'danger',
        message: err.message || 'Failed to terminate assignment.',
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Action: Run Lifecycle Reconciliation
  const syncGracePeriods = async () => {
    setIsSubmitting(true);
    try {
      const res = await coachingApi.syncGracePeriods();
      showToast({
        type: 'success',
        message: `Sync complete: ${res.pausedCount} expired passes paused (10-day grace started), ${res.terminatedCount} grace periods expired & released.`,
        duration: 6000,
      });
      await fetchCoachingData();
      return res;
    } catch (err) {
      showToast({
        type: 'danger',
        message: err.message || 'Failed to sync grace periods.',
      });
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    data,
    trainers,
    isLoading,
    isSubmitting,
    error,
    refresh: fetchCoachingData,
    refetch: fetchCoachingData,
    requestCoach,
    cancelCoachRequest,
    reviewCoachRequest,
    assignCoach,
    terminateCoachAssignment,
    syncGracePeriods,
  };
}

export default useCoaching;

