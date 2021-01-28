import Axios, { AxiosResponse } from 'axios';
import { action, makeAutoObservable } from 'mobx';

import { SERVER } from '../consts';

import { RootStore } from './Store';
import { Dataset } from './Types/Dataset';
import { Project, ProjectList, UploadedDatasetList } from './Types/Project';

export class ProjectStore {
  rootStore: RootStore;
  currentProject: Project | null = null;
  projects: ProjectList = [];
  comparisonDatasetKey: string | null = null;
  loadedDataset: Dataset | null = null;
  comparisonDataset: Dataset | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
    this.loadProjects();
  }

  // ##################################################################### //
  // ############################## Getters ############################## //
  // ##################################################################### //

  get state() {
    return this.rootStore.state;
  }

  get provenance() {
    return this.rootStore.provenance;
  }

  // ##################################################################### //
  // ########################### Store Helpers ########################### //
  // ##################################################################### //

  projectByKey = (key: string) => {
    const proj = this.projects.find((p) => p.key === key);

    return proj;
  };

  // ##################################################################### //
  // ########################### Store Actions ########################### //
  // ##################################################################### //

  loadProjects = (newProjectId: string | null = null) => {
    Axios.get(`${SERVER}/project`).then(
      action((response: AxiosResponse<ProjectList>) => {
        this.projects = response.data;

        if (!newProjectId && this.rootStore.debug) {
          this.loadProjectByKey(this.rootStore.defaultProject);
        }

        if (newProjectId) {
          const proj = this.projects.find((p) => p.key === newProjectId);

          if (proj) {
            this.loadProjectByKey(proj.key);
          }
        }
      }),
    );
  };

  loadProjectByKey = (projectId: string) => {
    const proj = this.projectByKey(projectId);

    if (!proj) return;

    Axios.get(`${SERVER}/${projectId}/dataset`).then(
      action((response: AxiosResponse<UploadedDatasetList>) => {
        this.currentProject = { ...proj, datasets: response.data };

        if (this.rootStore.debug && this.currentProject.datasets.length > 0) {
          this.loadDataset(this.currentProject.datasets[0].key);
        }
      }),
    );
  };

  loadComparisonDataset = (datasetKey: string) => {
    if (!this.currentProject) return;

    Axios.get(`${SERVER}/${this.currentProject.key}/dataset/${datasetKey}`).then(
      action((response: AxiosResponse<Dataset>) => {
        this.comparisonDatasetKey = datasetKey;
        this.comparisonDataset = response.data;
      }),
    );
  };

  // ##################################################################### //
  // ######################### Provenance Actions ######################## //
  // ##################################################################### //

  loadDataset = (datasetKey: string) => {
    if (!this.currentProject) return;

    Axios.get(`${SERVER}/${this.currentProject.key}/dataset/${datasetKey}`).then(
      action((response: AxiosResponse<Dataset>) => {
        this.rootStore.bundledNodes.push(this.rootStore.currentNodes);
        this.rootStore.currentNodes = [];

        this.rootStore.provenanceActions.changeDatasetAction.setLabel(`Load ${datasetKey} dataset`);
        this.provenance.apply(this.rootStore.provenanceActions.changeDatasetAction(datasetKey));

        this.rootStore.currentNodes.push(this.provenance.graph.current);

        this.loadedDataset = response.data;
      }),
    );
  };
}
