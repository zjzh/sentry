import {mountWithTheme} from 'sentry-test/enzyme';
import {initializeOrg} from 'sentry-test/initializeOrg';

import CreateDashboard from 'sentry/views/dashboardsV2/create';

describe('Dashboards > Create', function () {
  const organization = TestStubs.Organization({
    features: [
      'dashboards-basic',
      'dashboards-edit',
      'discover-query',
      'dashboard-grid-layout',
    ],
  });

  describe('new dashboards', function () {
    let wrapper, initialData;

    beforeEach(function () {
      initialData = initializeOrg({organization});

      //   MockApiClient.addMockResponse({
      //     url: '/organizations/org-slug/tags/',
      //     body: [],
      //   });
      //   MockApiClient.addMockResponse({
      //     url: '/organizations/org-slug/projects/',
      //     body: [TestStubs.Project()],
      //   });
      //   MockApiClient.addMockResponse({
      //     url: '/organizations/org-slug/dashboards/',
      //     body: [
      //       TestStubs.Dashboard([], {id: 'default-overview', title: 'Default'}),
      //       TestStubs.Dashboard([], {id: '1', title: 'Custom Errors'}),
      //     ],
      //   });
      //   MockApiClient.addMockResponse({
      //     url: '/organizations/org-slug/dashboards/default-overview/',
      //     body: TestStubs.Dashboard([], {id: 'default-overview', title: 'Default'}),
      //   });
      //   MockApiClient.addMockResponse({
      //     url: '/organizations/org-slug/dashboards/1/visit/',
      //     method: 'POST',
      //     body: [],
      //     statusCode: 200,
      //   });
    });

    afterEach(function () {
      MockApiClient.clearMockResponses();
      if (wrapper) {
        wrapper.unmount();
      }
    });

    it('can create with new widget', async function () {
      wrapper = mountWithTheme(
        <CreateDashboard
          organization={initialData.organization}
          params={{orgId: 'org-slug'}}
          router={initialData.router}
          location={initialData.router.location}
        />,
        initialData.routerContext
      );
      await tick();
      wrapper.update();

      // act(() => wrapper.find('AddWidget').simulate('click'));
      console.log(wrapper.debug());
      wrapper.find('AddWidget').simulate('click');
    });
  });
});
