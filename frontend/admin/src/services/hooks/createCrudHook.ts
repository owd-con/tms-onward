/**
 * Generic CRUD hook factory
 * Creates a standardized hook for CRUD operations with consistent error handling
 *
 * @module createCrudHook
 */

import { useCallback, useMemo } from "react";
import { useFormActions } from "../form/hooks";
import { logger } from "@/utils/logger";
import type { ApiResponse, PaginatedResponse } from "../types/api";

/**
 * Configuration for CRUD hook operations
 * @template TEntity - The entity type (used for type consistency with createCrudHook)
 */
export interface CrudHookConfig<TEntity = unknown> {
  /**
   * @internal Type parameter for consistency with createCrudHook<TEntity>
   */
  readonly _?: TEntity;
  /**
   * Lazy query hook for listing entities
   */
  useLazyGetQuery: () => readonly [
    (params?: Record<string, unknown>) => Promise<unknown>,
    unknown,
    ...unknown[]
  ];
  /**
   * Lazy query hook for showing single entity
   */
  useLazyShowQuery?: () => readonly [
    (options: {
      id: string | number;
      params?: Record<string, unknown>;
    }) => Promise<unknown>,
    unknown,
    ...unknown[]
  ];
  /**
   * Mutation hook for creating entity
   */
  useCreateMutation?: () => readonly [unknown, unknown];
  /**
   * Mutation hook for updating entity
   */
  useUpdateMutation?: () => readonly [unknown, unknown];
  /**
   * Mutation hook for removing entity
   */
  useRemoveMutation?: () => readonly [unknown, unknown];
  /**
   * Optional: Additional lazy query hooks (e.g., summary, custom endpoints)
   */
  additionalQueries?: Record<
    string,
    () => readonly [
      (params?: Record<string, unknown>) => Promise<unknown>,
      unknown,
      ...unknown[]
    ]
  >;
  /**
   * Optional: Custom operations (e.g., activate, deactivate)
   */
  customOperations?: Record<
    string,
    {
      hook: () => readonly [unknown, unknown];
      errorMessage?: string;
      requiresId?: boolean; // If false, custom operation accepts payload directly without id
    }
  >;
  /**
   * Entity name for logging (e.g., "client", "item")
   */
  entityName: string;
}

/**
 * Standard RTK Query operation result
 */
export interface OperationResult<T = unknown> {
  data?: T;
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: unknown;
}

/**
 * Standard RTK Query mutation result
 */
export interface MutationResult<T = unknown> {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: unknown;
  data?: T;
  reset: () => void;
}

/**
 * Return type for CRUD hook
 */
export interface CrudHookReturn<TEntity> {
  // List operations
  get: (
    params?: Record<string, unknown>
  ) => Promise<PaginatedResponse<TEntity> | ApiResponse<TEntity[]> | undefined>;
  getResult: OperationResult<PaginatedResponse<TEntity> | ApiResponse<TEntity[]>>;

  // Detail operations
  show: (options: {
    id: string | number;
    params?: Record<string, unknown>;
  }) => Promise<ApiResponse<TEntity> | undefined>;
  showResult: OperationResult<ApiResponse<TEntity>>;

  // Create operations
  create: (payload: Record<string, unknown>) => Promise<void>;
  createResult: MutationResult;

  // Update operations
  update: (options: {
    id: string | number;
    payload?: Record<string, unknown>;
  }) => Promise<void>;
  updateResult: MutationResult;

  // Remove operations
  remove: (options: {
    id: string | number;
    payload?: Record<string, unknown>;
  }) => Promise<void>;
  removeResult: MutationResult;

  // Additional queries (if provided)
  [key: string]: any;
}

export const useNoopLazyQuery = () =>
  [
    async () => {
      return undefined;
    },
    {
      data: undefined,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: false,
    },
  ] as const;

const useNoopMutation = () =>
  [
    async () => {
      return undefined;
    },
    {
      isLoading: false,
      isSuccess: false,
      isError: false,
      reset: () => { },
    },
  ] as const;

/**
 * Creates a generic CRUD hook with standardized error handling
 *
 * @template TEntity - The entity type
 * @param config - Configuration object with RTK Query hooks
 * @returns CRUD hook with all operations
 *
 * @example
 * ```tsx
 * const useClient = createCrudHook({
 *   useLazyGetQuery: useLazyGetClientQuery,
 *   useLazyShowQuery: useLazyShowClientQuery,
 *   useCreateMutation: useCreateClientMutation,
 *   useUpdateMutation: useUpdateClientMutation,
 *   useRemoveMutation: useRemoveClientMutation,
 *   customOperations: {
 *     activate: {
 *       hook: useActivateClientMutation,
 *       errorMessage: "Failed to activate client",
 *     },
 *   },
 *   entityName: "client",
 * });
 * ```
 */
export function createCrudHook<TEntity = unknown>(
  config: CrudHookConfig<TEntity>
): () => CrudHookReturn<TEntity> {
  const {
    useLazyGetQuery,
    useLazyShowQuery = useNoopLazyQuery,
    useCreateMutation = useNoopMutation,
    useUpdateMutation = useNoopMutation,
    useRemoveMutation = useNoopMutation,
    entityName,
  } = config;

  return () => {
    const { failureWithTimeout } = useFormActions();

    // List query
    const [triggerGet, getResult] = useLazyGetQuery();

    const get = useCallback(
      async (
        params?: Record<string, unknown>
      ): Promise<
        PaginatedResponse<TEntity> | ApiResponse<TEntity[]> | undefined
      > => {
        try {
          const trigger = triggerGet as (params?: Record<string, unknown>) => {
            unwrap: () => Promise<
              PaginatedResponse<TEntity> | ApiResponse<TEntity[]>
            >;
          } & Promise<unknown>;

          if (triggerGet === useNoopLazyQuery()[0]) return undefined;

          return await trigger(params).unwrap();
        } catch (err) {
          logger.error(`Failed to get ${entityName}`, err);
          throw err;
        }
      },
      [triggerGet]
    );

    // Show query
    const [triggerShow, showResult] = useLazyShowQuery();

    const show = useCallback(
      async (options: {
        id: string | number;
        params?: Record<string, unknown>;
      }): Promise<ApiResponse<TEntity> | undefined> => {
        try {
          const trigger = triggerShow as (options: {
            id: string | number;
            params?: Record<string, unknown>;
          }) => {
            unwrap: () => Promise<ApiResponse<TEntity>>;
          } & Promise<unknown>;

          if (triggerShow === useNoopLazyQuery()[0]) return undefined;

          return await trigger({
            id: options.id,
            params: options.params,
          }).unwrap();
        } catch (err) {
          logger.error(`Failed to show ${entityName} ${options.id}`, err);
          throw err;
        }
      },
      [triggerShow]
    );

    // Create mutation
    const [createMutation, createResult] = useCreateMutation();

    const create = useCallback(
      async (payload: Record<string, unknown>): Promise<void> => {
        try {
          const mutation = createMutation as (
            payload: Record<string, unknown>
          ) => { unwrap: () => Promise<unknown> } & Promise<unknown>;

          if (createMutation === useNoopMutation()[0]) return;

          await mutation(payload).unwrap();
        } catch (err) {
          failureWithTimeout(err);
        }
      },
      [createMutation, failureWithTimeout]
    );

    // Update mutation
    const [updateMutation, updateResult] = useUpdateMutation();

    const update = useCallback(
      async (options: {
        id: string | number;
        payload?: Record<string, unknown>;
      }): Promise<void> => {
        try {
          const mutation = updateMutation as (options: {
            id: string | number;
            [key: string]: unknown;
          }) => { unwrap: () => Promise<unknown> } & Promise<unknown>;

          if (updateMutation === useNoopMutation()[0]) return;

          await mutation({ id: options.id, ...options.payload }).unwrap();
        } catch (err) {
          failureWithTimeout(err);
        }
      },
      [updateMutation, failureWithTimeout]
    );

    // Remove mutation
    const [removeMutation, removeResult] = useRemoveMutation();

    const remove = useCallback(
      async (options: {
        id: string | number;
        payload?: Record<string, unknown>;
      }): Promise<void> => {
        try {
          // Try calling with object format { id } (for delete mutations that expect { id: string })
          try {
            const mutationObject = removeMutation as (options: {
              id: string | number;
              payload?: Record<string, unknown>;
            }) => { unwrap: () => Promise<unknown> } & Promise<unknown>;
            await mutationObject({
              id: options.id,
              ...options.payload,
            }).unwrap();
          } catch {
            // Fallback to simple id format (for delete mutations that expect id: string directly)
            const mutationSimple = removeMutation as (id: string | number) => {
              unwrap: () => Promise<unknown>;
            } & Promise<unknown>;
            await mutationSimple(options.id).unwrap();
          }
        } catch (err) {
          failureWithTimeout(err);
        }
      },
      [removeMutation, failureWithTimeout]
    );

    // Extract additional queries and custom operations results before useMemo
    const additionalResults: Record<string, any> = {};
    if (config.additionalQueries) {
      for (const [key, hook] of Object.entries(config.additionalQueries)) {
        additionalResults[key] = hook();
      }
    }

    const customResults: Record<string, any> = {};
    if (config.customOperations) {
      for (const [key, operation] of Object.entries(config.customOperations)) {
        customResults[key] = operation.hook();
      }
    }

    // Build return object
    const returnValue = useMemo((): CrudHookReturn<TEntity> => {
      const basicOps: CrudHookReturn<TEntity> = {
        get,
        getResult: getResult as OperationResult<
          PaginatedResponse<TEntity> | ApiResponse<TEntity[]>
        >,
        show,
        showResult: showResult as OperationResult<ApiResponse<TEntity>>,
        create,
        createResult: createResult as MutationResult,
        update,
        updateResult: updateResult as MutationResult,
        remove,
        removeResult: removeResult as MutationResult,
      };

      // Add additional queries
      if (config.additionalQueries) {
        for (const [key] of Object.entries(config.additionalQueries)) {
          const [trigger, result] = additionalResults[key];
          basicOps[key] = async (params?: Record<string, unknown>) => {
            try {
              const triggerFn = trigger as (
                params?: Record<string, unknown>
              ) => { unwrap: () => Promise<unknown> } & Promise<unknown>;
              return await triggerFn(params).unwrap();
            } catch (err) {
              logger.error(`Failed to ${key} ${entityName}`, err);
              throw err;
            }
          };
          basicOps[`${key}Result`] = result as OperationResult;
        }
      }

      // Add custom operations
      if (config.customOperations) {
        for (const [key, operation] of Object.entries(config.customOperations)) {
          const [mutation, result] = customResults[key];
          const requiresId = operation.requiresId !== false; // Default to true for backward compatibility

          if (requiresId) {
            // Custom operation requires id (like update, remove)
            basicOps[key] = async (options: {
              id: string | number;
              payload?: Record<string, unknown>;
            }) => {
              try {
                const mutationFn = mutation as (options: {
                  id: string | number;
                  [key: string]: unknown;
                }) => { unwrap: () => Promise<unknown> } & Promise<unknown>;
                // Spread payload directly instead of wrapping in payload object
                await mutationFn({
                  id: options.id,
                  ...(options.payload || {}),
                }).unwrap();
              } catch (err) {
                failureWithTimeout(err);
              }
            };
          } else {
            // Custom operation doesn't require id (like createSync)
            basicOps[key] = async (payload: Record<string, unknown>) => {
              try {
                const mutationFn = mutation as (
                  payload: Record<string, unknown>
                ) => { unwrap: () => Promise<unknown> } & Promise<unknown>;
                await mutationFn(payload).unwrap();
              } catch (err) {
                failureWithTimeout(err);
              }
            };
          }
          basicOps[`${key}Result`] = result as MutationResult;
        }
      }

      return basicOps;
    }, [
      get,
      getResult,
      show,
      showResult,
      create,
      createResult,
      update,
      updateResult,
      remove,
      removeResult,
      additionalResults,
      customResults,
      config,
      entityName,
      failureWithTimeout,
    ]);

    return returnValue;
  };
}
