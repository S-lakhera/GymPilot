import { useState, useEffect, useCallback } from 'react';
import { workoutApi } from '../api/workoutApi.js';
import { useToast } from './useToast.js';

export function useWorkoutPlan() {
  const { showToast } = useToast();
  const [exercises, setExercises] = useState([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState(false);
  const [exercisesError, setExercisesError] = useState(null);

  const fetchExercises = useCallback(async (filters = {}) => {
    setIsLoadingExercises(true);
    setExercisesError(null);
    try {
      const data = await workoutApi.getExercises(filters);
      setExercises(data || []);
      return data;
    } catch (err) {
      const msg = err.message || 'Failed to load exercises catalog.';
      setExercisesError(msg);
      return [];
    } finally {
      setIsLoadingExercises(false);
    }
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const addCustomExercise = async (exerciseData) => {
    try {
      const created = await workoutApi.createCustomExercise(exerciseData);
      showToast({ type: 'success', message: 'Custom exercise added successfully.' });
      await fetchExercises();
      return { success: true, exercise: created };
    } catch (err) {
      showToast({ type: 'danger', message: err.message || 'Failed to add custom exercise.' });
      return { success: false, error: err.message };
    }
  };

  const savePlan = async (planData, planId = null) => {
    try {
      let saved;
      if (planId) {
        saved = await workoutApi.updatePlan(planId, planData);
        showToast({ type: 'success', message: 'Workout plan updated successfully.' });
      } else {
        saved = await workoutApi.createPlan(planData);
        showToast({ type: 'success', message: 'Workout plan created and assigned to athlete.' });
      }
      return { success: true, plan: saved };
    } catch (err) {
      showToast({ type: 'danger', message: err.message || 'Failed to save workout plan.' });
      return { success: false, error: err.message };
    }
  };

  const removePlan = async (planId) => {
    try {
      await workoutApi.deletePlan(planId);
      showToast({ type: 'success', message: 'Workout plan removed.' });
      return { success: true };
    } catch (err) {
      showToast({ type: 'danger', message: err.message || 'Failed to delete workout plan.' });
      return { success: false, error: err.message };
    }
  };

  return {
    exercises,
    isLoadingExercises,
    exercisesError,
    fetchExercises,
    addCustomExercise,
    savePlan,
    removePlan,
  };
}
